const Pipeline = require('../pipeline')

const Config = require('../config')
const Compose = require('../compose')
const utils = require('../utils')
const SSH = require('../ssh')

jest.mock('../config', () =>
	jest.fn().mockImplementation(() => ({
		ssh: {
			host: 'host',
			user: 'user',
			key: 'key',
			target: 'target',
		},
		registry: {
			url: 'url',
			username: 'user',
			password: 'password',
		},
		compose_file: 'docker-compose.yml',
		files: ['file.txt'],
		envs: { TEST: 1 },
		branch: 'edu-12-features',
	})),
)

jest.mock('../compose.js', () =>
	jest.fn().mockImplementation(() => ({
		envsubst: jest.fn(),
		build: jest.fn(),
		deploy: jest.fn().mockReturnValue(Promise.resolve()),
	})),
)

jest.mock('../utils.js', () => ({
	getTag: jest.fn().mockReturnValue('tag'),
}))

jest.mock('../ssh.js', () =>
	jest.fn().mockImplementation(() => ({
		connect: jest.fn().mockReturnValue(Promise.resolve()),
		dispose: jest.fn().mockReturnValue(Promise.resolve()),
		commands: jest.fn().mockReturnValue(Promise.resolve()),
		copy: jest.fn().mockReturnValue(Promise.resolve()),
	})),
)

describe('pipeline', () => {
	it('must init values', () => {
		const pipeline = new Pipeline()

		expect(pipeline).toHaveProperty('config')
		expect(pipeline).toHaveProperty('ssh')
		expect(pipeline).toHaveProperty('compose')
	})
	describe('run', () => {
		it('must run compose.envsubst', async () => {
			const pipeline = new Pipeline()
			await pipeline.run()
			expect(pipeline.compose.envsubst).toBeCalled()
		})
		it('must run compose.build', async () => {
			const pipeline = new Pipeline()
			await pipeline.run()
			expect(pipeline.compose.build).toBeCalled()
		})
		it('must run ssh.connect', async () => {
			const pipeline = new Pipeline()
			await pipeline.run()
			expect(pipeline.ssh.connect).toBeCalled()
		})
		it('must run ssh.copy', async () => {
			const pipeline = new Pipeline()
			await pipeline.run()
			expect(pipeline.ssh.copy).toBeCalled()
		})
		it('must run ssh.copy with correct files', async () => {
			const pipeline = new Pipeline()
			await pipeline.run()
			expect(pipeline.ssh.copy).toBeCalledWith(['file.txt'])
		})
		it('must run ssh.dispose', async () => {
			const pipeline = new Pipeline()
			await pipeline.run()
			expect(pipeline.ssh.dispose).toBeCalled()
		})
		it('must run compose.build', async () => {
			const pipeline = new Pipeline()
			await pipeline.run()
			expect(pipeline.compose.deploy).toBeCalled()
		})
	})
})
