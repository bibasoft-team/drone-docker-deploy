const { getTag, escape, getFirstGroup, exec, docker_login } = require('../utils')
const _exec = require('shelljs.exec')

jest.mock('shelljs.exec', () =>
	jest.fn().mockReturnValue({
		error: null,
		stdout: 'stdout',
		stderr: 'stderr',
		code: 123,
		ok: true,
	}),
)

afterEach(() => {
	jest.clearAllMocks()
})

describe('utils getTag', () => {
	it('empty string', () => {
		expect(getTag('')).toBe('')
	})

	it('simple string', () => {
		expect(getTag('features-2')).toBe('features-2')
	})

	it('simple string with escape', () => {
		expect(getTag('features/test-2')).toBe('features-test-2')
	})

	it('string with jira tag', () => {
		expect(getTag('TEST-2-wgw-wg')).toBe('test-2')
	})

	it('string with jira tag and prefix', () => {
		expect(getTag('features/TEST-2')).toBe('test-2')
	})
})

describe('utils escape', () => {
	it('empty string', () => {
		expect(escape('')).toBe('')
	})

	it('simple string', () => {
		expect(escape('test')).toBe('test')
	})

	it('uppercase string', () => {
		expect(escape('TEST')).toBe('test')
	})

	it('string with syms', () => {
		expect(escape('test/123-g*')).toBe('test-123-g-')
	})
})

describe('utils getFirstGroup', () => {
	it('empty string', () => {
		expect(getFirstGroup(/([0-9]+)/g, '')).toEqual([])
	})

	it('simple string', () => {
		expect(getFirstGroup(/([0-9]+)/g, '1234')).toEqual(['1234'])
	})
})

describe('utils exec', () => {
	it('must call', () => {
		exec('')
		expect(_exec).toBeCalled()
	})
	it('must call with string args', () => {
		exec('npm run test')
		expect(_exec).toBeCalledWith('npm run test', { stdio: 'inherit' })
	})
	it('must call with array args', () => {
		exec(['npm', 'run', 'test'])
		expect(_exec).toBeCalledWith('npm run test', { stdio: 'inherit' })
	})
})

describe('utils docker_login', () => {
	it('must return correct command', () => {
		expect(docker_login('url', 'user', 'password')).toEqual(
			`docker login -u user --password password url`,
		)
	})
})
