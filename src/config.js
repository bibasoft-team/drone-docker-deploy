const { getTag } = require('./utils')
const path = require('path')

class Config {
	constructor() {
		const {
			PLUGIN_SSH_HOST,
			PLUGIN_SSH_USER,
			PLUGIN_SSH_KEY,
			PLUGIN_REGISTRY_USERNAME,
			PLUGIN_REGISTRY_PASSWORD,
			PLUGIN_REGISTRY_URL,
			PLUGIN_COMPOSE_FILE = 'docker-compose.yml',
			PLUGIN_TARGET,
			PLUGIN_FILES,
			PLUGIN_ENVS = '{}',

			DRONE_SOURCE_BRANCH,
		} = process.env

		const tag = getTag(DRONE_SOURCE_BRANCH)

		this.ssh = {
			host: PLUGIN_SSH_HOST,
			user: PLUGIN_SSH_USER,
			key: PLUGIN_SSH_KEY,
			target: PLUGIN_TARGET ? path.join(PLUGIN_TARGET, tag) : '',
		}
		this.registry = {
			url: PLUGIN_REGISTRY_URL,
			username: PLUGIN_REGISTRY_USERNAME,
			password: PLUGIN_REGISTRY_PASSWORD,
		}
		this.compose_file = PLUGIN_COMPOSE_FILE
		this.files = PLUGIN_FILES?.split(',') || []
		this.envs = JSON.parse(PLUGIN_ENVS)
		this.branch = DRONE_SOURCE_BRANCH
	}
}

module.exports = Config