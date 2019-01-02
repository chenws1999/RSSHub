const request = require('request-promise-native')
const tunnel = require('tunnel')

const generateAgent = (host, port) => {
	return tunnel.httpsOverHttp({
		proxy: {
			host,
			port
		}
	})
}

module.exports.getAgent = () => generateAgent('119.101.112.86', '9999')

const maxTimeout = 3000

const ipList = []


