const fs = require('fs')
const envsubst = require('./envsubst')
const { exec, docker_login } = require('./utils')
const SSH = require('./ssh')

class Compose {
	constructor(envs, registry, ssh) {
		this.envs = envs
		this.registry = registry
		this.ssh = new SSH(ssh)
	}

	envsubst(file) {
		if (!fs.existsSync(file)) throw `docker-compose file "${file}" does not exist`

		const compose_file = fs.readFileSync(file).toString()
		const _compose_file = envsubst(compose_file, this.envs)

		fs.writeFileSync(file, _compose_file)
	}

	build(file) {
		const drone_commands = [
			docker_login(this.registry.url, this.registry.username, this.registry.password),
			`docker-compose -f ${file} build --pull`,
			`docker-compose -f ${file} push`,
		]

		drone_commands.forEach(command => {
			const res = exec(command)

			if (!res.ok) {
				throw res.error
			}
		})
	}
	async deploy(file) {
		await this.ssh.connect()
		const ssh_commands = [
			docker_login(this.registry.url, this.registry.username, this.registry.password),
			// `docker-compose -f ${this.file} down`,
			`docker-compose -f ${file} pull`,
			`docker-compose -f ${file} up -d --no-build`,
		]
		await this.ssh.commands(ssh_commands)
		await this.ssh.dispose()
	}
}

module.exports = Compose
