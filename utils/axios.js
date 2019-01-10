const logger = require('./logger');
const config = require('../config');
const proxy = require('../server/tasks/proxy.js')

const axiosRetry = require('axios-retry');
const axios = require('axios');

// axiosRetry(axios, {
//     retries: config.requestRetry,
//     retryCondition: () => true,
//     retryDelay: (count, err) => {
//         logger.error(`Request ${err.config.url} fail, retry attempt #${count}: ${err}`);
//         return 100;
//     },
// });

console.log(process.env.NODE_TLS_REJECT_UNAUTHORIZED, 'tttttttttttttttttttt')
axios.defaults.headers.common['User-Agent'] = config.ua;
axios.defaults.headers.common['X-APP'] = 'RSSHub';


const reqTasks = []

const wait =() => new Promise((resolve => {
	reqTasks.push(resolve)
}))

const startReqSchedule = function () {
	const firstTask = reqTasks.shift()
	if (firstTask) {
		firstTask()
	}
	setTimeout(startReqSchedule, 2000)
}

startReqSchedule()

const addProxy = async function (config) {
	console.log('inner axios', config.url)
	// return config
	// config.proxy = {
	// 	host: '123.117.71.205',
	// 	port: 8060,
	// }
	await wait()
	// config.url = config.url.replace('https://www.zhihu.com/', 'https://www.zhihu.com:443/')
	// config.httpsAgent = proxy.getAgent()
	return config
}

const addRetryForInstance = (axios) => {
	axiosRetry(axios, {
		retries: config.requestRetry,
		retryCondition: () => true,
		retryDelay: (count, err) => {
			logger.error(`Request ${err.config.url} fail, retry attempt #${count}: ${err}`);
			return 100
		},
	})
}


axios.interceptors.request.use(addProxy)
addRetryForInstance(axios)


const createFunc = axios.create.bind(axios)
axios.create = (...args) => {
	const instance = createFunc(...args)
	instance.interceptors.request.use(addProxy)
	addRetryForInstance(instance)
	return instance
}

module.exports = axios
