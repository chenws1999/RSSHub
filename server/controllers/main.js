const Redis = require('ioredis')

const User = require('../models/User')
const Feed = require('../models/Feed')
const UserFeed = require('../models/UserFeed')
const settings = require('../config/settings.js')
const Enums = require('../lib/enums')
const redis = require('../lib/redis')

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
	await redis.set(cacheKey, countCache + 1)
	res.json({
		code: 0,
	})
}