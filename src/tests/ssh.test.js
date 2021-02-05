const SSH = require('../ssh')

const { NodeSSH } = require('node-ssh')

jest.mock('node-ssh', () => ({
	NodeSSH: jest.fn().mockImplementation(() => ({
		connect: jest.fn().mockReturnValue(Promise.resolve()),
		isConnected: jest.fn().mockReturnValue(true),
		putFiles: jest.fn().mockReturnValue(Promise.resolve()),
		mkdir: jest.fn().mockReturnValue(Promise.resolve()),
		execCommand: jest.fn().mockReturnValue(Promise.resolve({ stdout: 'test', stderr: null })),
		dispose: jest.fn().mockReturnValue(Promise.resolve()),
	})),
}))

afterEach(() => {
	jest.clearAllMocks()
})

describe('SSH', () => {
	it('must call NodeSHH constructor', () => {
		new SSH()
		expect(NodeSSH).toBeCalledTimes(1)
	})

	describe('connect', () => {
		it('must call connect', async () => {
			const config = { host: 'host', username: 'username', key: 'key' }
			const ssh = new SSH(config)

			await ssh.connect()

			expect(ssh.ssh.connect).toBeCalledTimes(1)
		})

		it('must call connect with right args', async () => {
			const config = { host: 'host', username: 'username', key: 'key' }
			const ssh = new SSH(config)

			await ssh.connect()

			expect(ssh.ssh.connect).toBeCalledWith({
				host: config.host,
				username: config.username,
				privateKey: config.key,
			})
		})

		it('must call isConnected', async () => {
			const config = { host: 'host', username: 'username', key: 'key' }
			const ssh = new SSH(config)

			await ssh.connect()

			expect(ssh.ssh.isConnected).toBeCalled()
		})

		it('must throw if not connected', async () => {
			const config = { host: 'host', username: 'username', key: 'key' }
			const ssh = new SSH(config)

			ssh.ssh.isConnected = jest.fn().mockReturnValue(false)

			await expect(async () => {
				await ssh.connect()
			}).rejects.toEqual('connection error')
		})
	})

	describe('copy', () => {
		it('must call mkdir', async () => {
			const config = { host: 'host', username: 'username', key: 'key', target: '/path/to/lol' }
			const ssh = new SSH(config)

			await ssh.copy(['example/file.txt', '/path/env.js', 'example/test.kek'])

			expect(ssh.ssh.mkdir).toBeCalledWith(config.target, 'exec')
		})
		it('must call connect', async () => {
			const config = { host: 'host', username: 'username', key: 'key', target: '/path/to/lol' }
			const ssh = new SSH(config)

			await ssh.copy(['example/file.txt', '/path/env.js', 'example/test.kek'])

			expect(ssh.ssh.putFiles).toBeCalledWith([
				{ local: 'example/file.txt', remote: '/path/to/lol/file.txt' },
				{ local: '/path/env.js', remote: '/path/to/lol/env.js' },
				{ local: 'example/test.kek', remote: '/path/to/lol/test.kek' },
			])
		})
	})

	describe('dispose', () => {
		it('must call dispose', async () => {
			const config = { host: 'host', username: 'username', key: 'key', target: '/path/to/lol' }
			const ssh = new SSH(config)

			await ssh.dispose()

			expect(ssh.ssh.dispose).toBeCalled()
		})
	})

	describe('_processError', () => {
		it('must ignore if contains warning', async () => {
			const config = { host: 'host', username: 'username', key: 'key', target: '/path/to/lol' }
			const ssh = new SSH(config)

			expect(() => ssh._processError('warning: it is bad test')).not.toThrow()
		})

		it('must ignore if contains uppercase warning', async () => {
			const config = { host: 'host', username: 'username', key: 'key', target: '/path/to/lol' }
			const ssh = new SSH(config)

			expect(() => ssh._processError('Warning: it is bad test')).not.toThrow()
		})

		it('must throw', async () => {
			const config = { host: 'host', username: 'username', key: 'key', target: '/path/to/lol' }
			const ssh = new SSH(config)

			expect(() => ssh._processError('error: it is bad test')).toThrow()
		})
	})

	describe('commands', () => {
		it('must call command 2 times', async () => {
			const config = { host: 'host', username: 'username', key: 'key', target: '/path/to/lol' }
			const ssh = new SSH(config)

			await ssh.commands(['test command', 'test command 2'])

			expect(ssh.ssh.execCommand).toBeCalledTimes(2)
		})

		it('must call commands with correct args', async () => {
			const config = { host: 'host', username: 'username', key: 'key', target: '/path/to/lol' }
			const ssh = new SSH(config)

			await ssh.commands(['test command', 'test command 2'])

			expect(ssh.ssh.execCommand).toHaveBeenNthCalledWith(1, 'test command', { cwd: config.target })
			expect(ssh.ssh.execCommand).toHaveBeenNthCalledWith(2, 'test command 2', {
				cwd: config.target,
			})
		})

		it('must handle stderr', async () => {
			const config = { host: 'host', username: 'username', key: 'key', target: '/path/to/lol' }

			const ssh = new SSH(config)
			ssh.ssh.execCommand = jest.fn().mockReturnValue({ stderr: 'error!' })
			ssh._processError = jest.fn()

			await ssh.commands(['test command', 'test command 2'])

			expect(ssh._processError).toBeCalledWith('error!')

			// expect(ssh.ssh.execCommand).toHaveBeenNthCalledWith(1, 'test command')
			// expect(ssh.ssh.execCommand).toHaveBeenNthCalledWith(1, 'test command 2')
		})

		it('must throw if _processError throw', async () => {
			const config = { host: 'host', username: 'username', key: 'key', target: '/path/to/lol' }

			const ssh = new SSH(config)
			ssh.ssh.execCommand = jest.fn().mockReturnValue({ stderr: 'error!' })
			ssh._processError = jest.fn(err => {
				throw err
			})

			await expect(async () => {
				await ssh.commands(['test command', 'test command 2'])
			}).rejects.toEqual('error!')

			// expect(ssh.ssh.execCommand).toHaveBeenNthCalledWith(1, 'test command')
			// expect(ssh.ssh.execCommand).toHaveBeenNthCalledWith(1, 'test command 2')
		})
	})
})
