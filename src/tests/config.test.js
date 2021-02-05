const Config = require('../config')

afterEach(() => {
	// clear envs
	process.env = Object.keys(process.env).reduce((all, name) => {
		if (name.startsWith('PLUGIN_')) {
			return all
		} else {
			return { ...all, [name]: process.env[name] }
		}
	}, {})
})

jest.mock('../utils.js', () => ({
	getTag: jest.fn().mockReturnValue('tag'),
}))

test('Config — must get env vars', () => {
	const ENV = {
		PLUGIN_SSH_HOST: 'host',
		PLUGIN_SSH_USER: 'user',
		PLUGIN_SSH_KEY: 'private',
		PLUGIN_REGISTRY_USERNAME: 'rediska1114',
		PLUGIN_REGISTRY_PASSWORD: 'password',
		PLUGIN_REGISTRY_URL: 'hub.docker',
		PLUGIN_COMPOSE_FILE: 'docker-compose.dev.yml',
		PLUGIN_TARGET: '/home/test/',
		PLUGIN_FILES: 'file.txt,file2.txt',
		PLUGIN_ENVS: 'image,test',
		DRONE_SOURCE_BRANCH: 'EDU-23',
		IMAGE: 'image',
		TEST: 'test',
		PLUGIN_TAG_SUFFIX: true,
	}
	process.env = ENV

	const config = new Config()

	expect(config.compose_file).toBe(ENV.PLUGIN_COMPOSE_FILE)
	expect(config.registry).toEqual({
		url: ENV.PLUGIN_REGISTRY_URL,
		username: ENV.PLUGIN_REGISTRY_USERNAME,
		password: ENV.PLUGIN_REGISTRY_PASSWORD,
	})
	expect(config.ssh).toEqual({
		host: ENV.PLUGIN_SSH_HOST,
		user: ENV.PLUGIN_SSH_USER,
		key: ENV.PLUGIN_SSH_KEY,
		target: ENV.PLUGIN_TARGET + 'tag',
	})
	expect(config.registry).toEqual({
		url: ENV.PLUGIN_REGISTRY_URL,
		username: ENV.PLUGIN_REGISTRY_USERNAME,
		password: ENV.PLUGIN_REGISTRY_PASSWORD,
	})
	expect(config.envs).toEqual({
		IMAGE: 'image',
		TEST: 'test',
	})
	expect(config.files).toEqual(['file.txt', 'file2.txt'])

	expect(config.branch).toEqual(ENV.DRONE_SOURCE_BRANCH)
})

test('Config — default values', () => {
	const config = new Config()

	expect(config.compose_file).toBe('docker-compose.yml')
	expect(config.files).toEqual([])
	expect(config.envs).toEqual({})
})

test('Config — without suffix', () => {
	process.env = {
		PLUGIN_TAG_SUFFIX: false,
		PLUGIN_TARGET: '/home/rediska/',
	}
	const config = new Config()

	expect(config.ssh.target).toBe('/home/rediska/')
})
