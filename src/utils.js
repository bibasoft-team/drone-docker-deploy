
const _exec = require('shelljs.exec')


function getTag(branch) {
    const match = getFirstGroup(/^([A-Z]+-[\d]+)/g, branch)
    if (!match) {
        return branch
    }

    console.log(branch, match)
    return match[0]
}

function escape(dir) {
    return (dir + '').toLowerCase().replace(/(?:(?![a-z0-9\-]).)/gm, '-')
}

function replaceTemplates(str, context) {
    return Object.keys(context).reduce((out, k) => {
        const regex = new RegExp(`\\$\\{${k}\\}`, 'g')
        return out.replace(regex, context[k])
    }, str)
}

function exec(s) { return Array.isArray(s) ? _exec(s.join(' '), { stdio: 'inherit' }) : _exec(s, { stdio: 'inherit' }) }

function getFirstGroup(regexp, str) {
    return Array.from(str.matchAll(regexp), m => m[1]);
}


module.exports = {
    getTag,
    escape,
    replaceTemplates,
    exec
}