const { NodeSSH } = require('node-ssh')
const path = require('path')

class SSH {
	constructor(config) {
		this.ssh = new NodeSSH()
		this.config = config
	}

	async connect() {
		console.log(`try connect to ${this.config.username}@${this.config.host}...`)

		await this.ssh.connect({
			host: this.config.host,
			username: this.config.username,
			privateKey: this.config.key,
		})
		if (this.ssh.isConnected()) {
			console.log('connect ok')
		} else {
			throw 'connection error'
		}
	}

	async copy(files) {
		await this.ssh.mkdir(this.config.target, 'exec')
		await this.ssh.putFiles(
			files.map(f => ({
				local: f,
				remote: path.join(this.config.target, path.parse(f).base),
			})),
		)
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
			throw err
		} else {
			console.warn('stderr', err)
		}
	}

	async dispose() {
		this.ssh.dispose()
	}
}

module.exports = SSH
