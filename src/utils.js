const _exec = require('shelljs.exec')

function getTag(branch) {
	const match = getFirstGroup(/([A-Z]+-[\d]+)/g, branch)
	if (!match || !match[0]) {
		return escape(branch)
	}
	return escape(match[0])
}

function escape(dir) {
	return (dir + '').toLowerCase().replace(/(?:(?![a-z0-9\-]).)/gm, '-')
}

function exec(s) {
	return Array.isArray(s)
		? _exec(s.join(' '), { stdio: 'inherit' })
		: _exec(s, { stdio: 'inherit' })
}

function getFirstGroup(regexp, str) {
	return Array.from(str.matchAll(regexp), m => m[1])
}

function docker_login(url, username, password) {
	return `docker login -u ${username} --password ${password} ${url}`
}

module.exports = {
	getTag,
	escape,
	getFirstGroup,
	exec,
	docker_login,
}
