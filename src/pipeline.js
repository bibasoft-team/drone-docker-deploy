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
		this.compose = new Compose(
			this.config.compose_file,
			{
				...this.config.envs,
				TAG: getTag(this.config.branch),
			},
			this.config.registry,
			this.config.ssh,
		) // TODO refactoring
		this.ssh = new SSH()
	}

	async run() {
		this.compose.envsubst()
		this.compose.build()

		await this.ssh.connect()
		await this.ssh.copy(this.config.files)
		await this.ssh.dispose()

		await this.compose.deploy()
	}

	// const TARGET = path.join(PLUGIN_PATH, TAG)
}

module.exports = Pipeline