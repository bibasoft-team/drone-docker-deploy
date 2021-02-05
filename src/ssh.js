const { NodeSSH } = require('node-ssh')
const path = require('path')

class SSH {
	constructor(config) {
		this.ssh = new NodeSSH()
		this.config = config
	}

	async connect() {
		console.log(`try connect to ${this.config.user}@${this.config.host}...`)

		await this.ssh.connect({
			host: this.config.host,
			username: this.config.user,
			privateKey: this.config.key,
		})
		if (this.ssh.isConnected()) {
			console.log('connect ok')
		} else {
			throw 'connection error'
		}
	}

	async copy(files) {
		console.log('mkdir ' + this.config.target)
		await this.ssh.mkdir(this.config.target, 'exec')
		const _files = files.map(f => ({
			local: f,
			remote: path.join(this.config.target, path.parse(f).base),
		}))
		console.log('copy files \n' + _files.map(f => `${f.local} ——> ${f.remote}`).join(',\n'))
		await this.ssh.putFiles(_files, {
			sftp: null,
		})
	}
	async commands(commands) {
		for (const command of commands) {
			const { stdout, stderr } = await this.ssh.execCommand(command, { cwd: this.config.target })
			if (stdout) console.log('stdout', stdout)
			if (stderr) {
				this._processError(stderr)
			}
		}
	}

	_processError(err) {
		if (!err.toLowerCase().includes('warning')) {
			console.error('stderr: ' + err)
			throw err
		} else {
			console.warn('stderr warn: ', err)
		}
	}

	async dispose() {
		this.ssh.dispose()
	}
}

module.exports = SSH
