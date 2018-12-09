const Redis = require('ioredis')

const User = require('../models/User')
const Feed = require('../models/Feed')
const UserFeed = require('../models/UserFeed')
const settings = require('../config/settings.js')
const Enums = require('../lib/enums')
const redis = require('../lib/redis')

const {RedisKeys} = Enums
exports.login = async function (params) {
	
}


exports.subscribeFeed =  async function () {
	const {feedCode} = req.body
	const feed = await Feed.findOne({code: feedCode})
	
	if (!feed) {
		throw new Error('invalid feild')
	}
	const cacheKey = Enums.RedisKeys.subscribeCount(user._id)
	const countCache = (await redis.get(cacheKey) || 0 )
	if (countCache === settings.subscribeLimit) {
		throw new Error('创建次数已用完')
	}

	const user = req.user
	const record = new UserFeed({
		code: feedCode,
		user,
		feed
	})
	await record.save()
	await redis.set(cacheKey, countCache + 1, 'EX', 3600)
	res.json({
		code: 0,
	})
}

exports.getRegistetCode = async (req, res) => {
	const {email} = req.body
	if (!email) {
		throw new Error('invalid email')
	}
	const redisKey = RedisKeys.emailCode(email)
	const findCode = await redis.get(redisKey)
	if (findOne) {
		throw new Error('已发送,请勿频繁点击')
	}
	
	const code = Math.random().toString(32).slice(2, 8).toUpperCase()
	await redis.set(redisKey, code, 'EX', 5 * 60)

	res.json({
		code: 0,
		resCode: code
	})
}

exports.register = async (req, res) => {
	const {email, password, code} = req.body

	const code = await redis.get()
}