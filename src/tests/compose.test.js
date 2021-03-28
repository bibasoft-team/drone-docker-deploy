const Compose = require('../compose')

const mock = require('mock-fs')
const path = require('path')
const fs = require('fs')
const envsubst = require('../envsubst')
const utils = require('../utils')
const SSH = require('../ssh')

beforeEach(() => {
	mock({
		'docker-compose.yml': '${IMAGE}_${TAG}',
		'docker-compose.build.yml': '${IMAGE}_${TAG}',
	})
})

afterEach(() => {
	mock.restore()
	jest.clearAllMocks()
})

jest.mock('../envsubst', () => jest.fn((c, { IMAGE, TAG }) => `${IMAGE}_${TAG}`))

jest.mock('../utils.js', () => ({
	exec: jest.fn(comm =>
		comm.includes('error.yml')
			? { error: 'sosi pisos', ok: false }
			: { error: null, stdout: 'stdout', stderr: 'stderr', code: 123, ok: true },
	),
	docker_login: jest.fn().mockReturnValue('docker login -u user -p password url'),
}))

jest.mock('../ssh.js', () =>
	jest.fn().mockImplementation(() => ({
		connect: jest.fn().mockReturnValue(Promise.resolve()),
		commands: jest.fn().mockReturnValue(Promise.resolve()),
		dispose: jest.fn().mockReturnValue(Promise.resolve()),
	})),
)

describe('compose', () => {
	describe('envsubst', () => {
		it('throw error if file not exists', () => {
			expect(() => new Compose().envsubst('docker.com.yml')).toThrow()
		})

		it('envsubst must call', () => {
			new Compose({}, {}).envsubst('docker-compose.yml')
			expect(envsubst).toHaveBeenCalled()
		})

		it('must pass arguments', () => {
			new Compose({ IMAGE: 1, TAG: 'test' }).envsubst('docker-compose.yml')
			expect(envsubst).toHaveBeenCalledWith('${IMAGE}_${TAG}', {
				IMAGE: 1,
				TAG: 'test',
			})
		})

		it('must return substituted values', () => {
			new Compose({ IMAGE: 1, TAG: 'test' }).envsubst('docker-compose.yml')
			expect(envsubst).toHaveReturnedWith('1_test')
		})
		it('must write output to file', () => {
			new Compose({ IMAGE: 1, TAG: 'test' }).envsubst('docker-compose.yml')
			expect(fs.readFileSync('docker-compose.yml').toString()).toEqual('1_test')
		})
	})

	describe('build', () => {
		it('must call exec 3 times', () => {
			const compose = new Compose(
				{ IMAGE: 1, TAG: 'test' },
				{ url: 'url', username: 'user', password: 'password' },
			)
			compose.build('docker-compose.build.yml')
			expect(utils.exec).toBeCalledTimes(3)
		})

		it('must call docker_login with correct args', () => {
			const compose = new Compose(
				{ IMAGE: 1, TAG: 'test' },
				{ url: 'url', username: 'user', password: 'password' },
			)
			compose.build('docker-compose.build.yml')
			expect(utils.docker_login).toBeCalledWith('url', 'user', 'password')
		})

		it('must call exec with correct args', () => {
			const compose = new Compose(
				{ IMAGE: 1, TAG: 'test' },
				{ url: 'url', username: 'user', password: 'password' },
			)
			compose.build('docker-compose.build.yml')
			expect(utils.exec).toHaveBeenNthCalledWith(1, 'docker login -u user -p password url')
			expect(utils.exec).toHaveBeenNthCalledWith(
				2,
				'docker-compose -f docker-compose.build.yml build --pull',
			)
			expect(utils.exec).toHaveBeenNthCalledWith(
				3,
				'docker-compose -f docker-compose.build.yml push',
			)
		})

		it('throw if exec return err', () => {
			const compose = new Compose(
				{ IMAGE: 1, TAG: 'test' },
				{ url: 'url', username: 'user', password: 'password' },
			)
			expect(() => compose.build('error.yml')).toThrow()
		})
	})

	describe('deploy', () => {
		it('must create new ssh class', () => {
			new Compose(
				{ IMAGE: 1, TAG: 'test' },
				{ url: 'url', username: 'user', password: 'password' },
				{
					host: 'host',
					user: 'user',
					key: 'key',
					target: 'target',
				},
			)
			expect(SSH).toBeCalledTimes(1)
		})

		it('must create new ssh class with correct params', () => {
			const ssh_config = {
				host: 'host',
				user: 'user',
				key: 'key',
				target: 'target',
			}
			const compose = new Compose(
				{ IMAGE: 1, TAG: 'test' },
				{ url: 'url', username: 'user', password: 'password' },
				ssh_config,
			)
			// compose.deploy()

			expect(SSH).toBeCalledWith(ssh_config)
		})

		it('must connect to ssh', async () => {
			const ssh_config = {
				host: 'host',
				user: 'user',
				key: 'key',
				target: 'target',
			}
			const compose = new Compose(
				{ IMAGE: 1, TAG: 'test' },
				{ url: 'url', username: 'user', password: 'password' },
				ssh_config,
			)
			await compose.deploy('docker-compose.yml')

			expect(compose.ssh.connect).toBeCalled()
		})

		it('must pass right commands', async () => {
			const ssh_config = {
				host: 'host',
				user: 'user',
				key: 'key',
				target: 'target',
			}
			const compose = new Compose(
				{ IMAGE: 1, TAG: 'test' },
				{ url: 'url', username: 'user', password: 'password' },
				ssh_config,
			)
			await compose.deploy('docker-compose.yml')

			expect(compose.ssh.commands).toBeCalledWith([
				'docker login -u user -p password url',
				`docker-compose -f docker-compose.yml pull`,
				`docker-compose -f docker-compose.yml up -d --no-build`,
			])
		})

		it('must dispose ssh', async () => {
			const ssh_config = {
				host: 'host',
				user: 'user',
				key: 'key',
				target: 'target',
			}
			const compose = new Compose(
				{ IMAGE: 1, TAG: 'test' },
				{ url: 'url', username: 'user', password: 'password' },
				ssh_config,
			)
			await compose.deploy('docker-compose.yml')

			expect(compose.ssh.dispose).toBeCalled()
		})
	})
})
