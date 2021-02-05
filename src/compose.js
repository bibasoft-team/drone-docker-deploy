const fs = require('fs')
const envsubst = require('./envsubst')
const { exec, docker_login } = require('./utils')
const SSH = require('./ssh')

class Compose {
	constructor(file, envs, registry, ssh) {
		this.file = file
		this.envs = envs
		this.registry = registry
		this.ssh = new SSH(ssh)
	}

	envsubst() {
		if (!fs.existsSync(this.file)) throw `docker-compose file "${this.file}" does not exist`

		const compose_file = fs.readFileSync(this.file).toString()
		const _compose_file = envsubst(compose_file, this.envs)

		fs.writeFileSync(this.file, _compose_file)
	}

	build() {
		const drone_commands = [
			docker_login(this.registry.url, this.registry.username, this.registry.password),
			`docker-compose -f ${this.file} build --pull`,
			`docker-compose -f ${this.file} push`,
		]

		drone_commands.forEach(command => {
			const res = exec(command)

			if (!res.ok) {
				throw res.error
			}
		})
	}
	async deploy() {
		await this.ssh.connect()
		const ssh_commands = [
			docker_login(this.registry.url, this.registry.username, this.registry.password),
			// `docker-compose -f ${this.file} down`,
			`docker-compose -f ${this.file} pull`,
			`docker-compose -f ${this.file} up -d --no-build`,
		]
		await this.ssh.commands(ssh_commands)
		await this.ssh.dispose()
	}
}

module.exports = Compose
