// pipeline

/**
  0. build image and push
  1. generate docker-compose file
  2. copy it to host to specific folder
  3. run docker-compose
 */

const Config = require('./config')
const Compose = require('./compose')
const { getTag } = require('./utils')
const SSH = require('./ssh')

class Pipeline {
	constructor() {
		this.config = new Config()
		// console.log(this.config)
		this.compose = new Compose(
			{
				...this.config.envs,
				TAG: getTag(this.config.branch),
			},
			this.config.registry,
			this.config.ssh,
		) // TODO refactoring
		this.ssh = new SSH(this.config.ssh)
	}

	async run() {
		this.compose.envsubst(this.config.compose_file)
		if (this.config.build_compose_file !== this.config.compose_file)
			this.compose.envsubst(this.config.build_compose_file)

		this.compose.build(this.config.build_compose_file)

		await this.ssh.connect()
		await this.ssh.copy([...this.config.files, this.config.compose_file])
		await this.ssh.dispose()

		await this.compose.deploy(this.config.compose_file)
	}

}

module.exports = Pipeline
