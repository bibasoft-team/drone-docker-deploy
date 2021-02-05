function envsubst(str, context = {}) {
	return Object.keys(context).reduce((out, k) => {
		const regex = new RegExp(`\\$\\{${k}\\}`, 'g')
		return out.replace(regex, context[k])
	}, str)
}

module.exports = envsubst
