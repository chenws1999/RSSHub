const Redis = require('ioredis')
const request = require('request-promise-native')

const User = require('../models/User')
const FeedOrigin = require('../models/FeedOrigin')
const Feed = require('../models/Feed')
const UserFeed = require('../models/UserFeed')
const UserSnapshot = require('../models/UserSnapshot')
const FeedItem = require('../models/FeedItem')

const settings = require('../config/settings.js')
const Enums = require('../lib/enums')
const redis = require('../lib/redis')

const {RedisKeys, FeedOriginPriorityTypes, FeedOriginParamTypes} = Enums

const global = {
	feedOriginTree: {}
}

function generateFeedSignatureStr (origin, params = []) {
	return origin._id + '?' + (params.map(obj => `${obj.key}=${obj.value}`).join('&'))
}

async function getFeedOriginTree () {
	const obj = {}
	const feeds = await FeedOrigin.find().lean()
	feeds.forEach((feed) => {
		if (feed.priority === Enums.FeedOriginPriorityTypes.main) {
			const key = feed._id
			if (!obj[key]) {
				obj[key] = {
					children: []
				}
			}
			Object.assign(obj[key], feed)
			
		} else {
			const key = feed.parent
			if (!obj[key]) {
				obj[key] = {
					children: []
				}
			}
			obj[key].children.push(feed)
		}
	})
	global.feedOriginTree = obj
	console.log(obj)
}
getFeedOriginTree()

const toPromise = (func) => (...args) => new Promise((resolve, reject) => {
	func(...args, (err, res) => {
		if (err) {
			return reject(err)
		}
		resolve(res)
	})	
})

exports.isLogin = async function (req, res, next) {
	if (req.isAuthenticated()) {
		next()
		return
	}
	res.json({
		code: -2,
		msg: '请先登录'
	})
}

exports.errHandler = function (err, req, res, next) {
	res.json({code: -1, msg: err.message || 'server error'})
	// console.log(err)
}

exports.getFeedOriginList = async function (req, res) {
	const limit = 10
	const {after} = req.query
	const user = req.user
	
	const myFeeds = await UserFeed.find({user})
	const codes = myFeeds.map(i => i.originCode)  //todo 缓存

	const list = Object.values(global.feedOriginTree)
	// const query = {}
	// if (priority) {
	// 	query.priority = priority
	// }
	// if (after) {
	// 	query.createAt = {
	// 		$lt: after
	// 	}
	// }
	// if (parent) {
	// 	query.parent = parent
	// }
	// const list = await FeedOrigin.find(query).sort({createAt: -1}).limit(limit).lean()
	res.json({
		code: 0,
		list: list.map(feed => {
			feed.children = feed.children.map(item => {
				// item.subscribe =  && codes.includes(item.code)
				// item.userFeedId = 
				return item
			})
			return feed
		})
	})
}

const getPickerValue = (rangeArr, pickerValue) => {
	if (!rangeArr || !rangeArr.length || !pickerValue || !pickerValue.length) {
		return null
	}
	const id = pickerValue.shift()
	const findOne = rangeArr.find(obj => obj._id === id)
	if (!findOne) {
		return null
	}
	if (findOne.children) {
		return getPickerValue(findOne.children, pickerValue)
	} else {
		return findOne
	}
}

exports.subscribeFeed =  async function (req, res) {
	const {originId, name, postParams = []} = req.body
	const user = req.user
	const feedOrigin = await FeedOrigin.findById(originId)
	
	if (!feedOrigin) {
		throw new Error('invalid feild id')
	}
	if (feedOrigin.priority === Enums.FeedOriginPriorityTypes.main) {
		throw new Error('暂不支持订阅一级源')
	}
	const count = await UserFeed.count({user})

	if (count >= settings.subscribeLimit) {
		throw new Error('超过订阅上限')
	}

	const params = []
	const needParams = !!(feedOrigin.params && feedOrigin.params.length)
	if (needParams) {
		feedOrigin.params.forEach(obj => {
			const {key, name, paramType, range} = obj
			const postValue = postParams[key]
			let value = postValue
			if (!postValue) {
				throw new Error('loss param filed data: ' + key)
			}
			if ([FeedOriginParamTypes.multiSelect, FeedOriginParamTypes.select].includes(paramType)) {
				const v = getPickerValue(range, postValue)
				if (!v) {
					throw new Error(`param: ${key}'s value invalid` )
				}
				value = v
			}
			params.push({
				value,
				key,
				name
			})
		})
	}
	
	const signatureStr = generateFeedSignatureStr(feedOrigin, params)
	let feed = await Feed.findOne({origin: feedOrigin, signatureStr})
	if (!feed) {
		feed = new Feed({
			origin: feedOrigin,
			originCode: feedOrigin.code,
			originType: feedOrigin.Type,
			params,
			signatureStr
		})
		await feed.save()
	}

	const findFeed = await UserFeed.findOne({feed, user})
	if (findFeed) {
		throw new Error('请勿重复订阅')
	}

	const record = new UserFeed({
		code: feed.code,
		originCode: feed.originCode,
		user,
		feed,
		name: name || feedOrigin.name
	})
	await record.save()
	res.json({
		code: 0,
	})
}

exports.unsubscribeFeed =  async function (req, res) {
	const {userFeedId, feedId} = req.body
	const user = req.user

	const query = userFeedId ? {_id: userFeedId} : {feed: feedId, user}
	const userFeed = await UserFeed.findOne(query)
	if (!userFeed) {
		throw new Error('invalid userfeed')
	}
	if (userFeed.user._id.toString() !== user._id.toString()) {
		throw new Error('越权操作')
	}
	await userFeed.remove()

	res.json({
		code: 0,
	})
}

exports.getPushRecordList = async function (req, res) {
	const {after} = req.params
	const unread = parseInt(req.query.unread)
	const limit = 5
	const user = req.user

	const query = {user}
	if (after) {
		query.pushTime = {
			$lt: after
		}
	}
	if (unread) {
		query.unread = 1
	}
	const list = await UserSnapshot.find(query).sort({pushTime: -1}).limit(limit)
	res.json({
		code: 0,
		list,
	})
}



exports.readPushRecord = async function (req, res) {
	const user = req.user
	const {recordId} = req.body

	const record = await UserSnapshot.findById(recordId)
	if (!record || (record.user._id.toString() !== user._id)) {
		throw new Error('无效或越权操作')
	}

	record.unread = 0
	await record.save()

	res.json({
		code: 0,
	})
}


exports.getFeedContentList = async function (req, res) {
	const user = req.user
	const {feed: feedId, after} = req.query
	const limit = 10

	const userFeed = await UserFeed.findOne({feed: feedId, user})
	if (!userFeed) {
		throw new Error('越权操作')
	}

	const query = {}
	if (after) {
		query.createAt = {
			$lt: after
		}
	}
	const list = await FeedItem.find(query).sort({createAt: -1}).limit(limit)
	res.json({
		code: 0,
		list
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

exports.login = async (req, res) => {
	if (req.isAuthenticated()) {
		throw new Error('已登录,请勿重复登录`')
	}
	const {code} = req.body
	const wxUrl = 'https://api.weixin.qq.com/sns/jscode2session'
	const wxRes = await request(wxUrl, {
		method: 'GET',
		qs: {
			appid: settings.appId,
			secret: settings.appSecret,
			js_code: code,
			grant_type: ' authorization_code'
		},
		json: true
	})
	if (wxRes.errcode) {
		throw new Error('wx server error: ' +  wxRes.errcode + wxRes.errmsg)
	}

	const {openid: openId, session_key: sessionKey} = wxRes
	
	let user = await User.findOne({openId})
	if (!user) {
		user = new User({
			openId,
		})
		await user.save()
	} 
	await toPromise(req.logIn.bind(req))(user)
	req.session.sessionKey = sessionKey

	res.json({
		code: 0,
	})
}

exports.getCsrfToken = async (req, res) => {
	res.json({
		code: 0,
		_csrf: req.csrfToken()
	})
}


exports.getMineInfo = async (req, res) => {
	const user = req.user

	res.json({
		code: 0,
		user,
		_csrf: req.csrfToken()
	})
}

exports.getOverview = async (req, res) => {
	const user = req.user

	const unreadPush = await UserSnapshot.findOne({user}).sort({createAt: -1}).lean()
	const unreadCount = await UserSnapshot.count({user, unread: 1})
	const feedList = await await UserFeed.find({user})
		.populate({path: 'feed', populate: 'origin'})
		.sort({createAt: -1})
		.lean()

	res.json({
		code: 0,
		unreadPush,
		unreadCount,
		feedList,
	})
}


exports.getMyFeedList = async function (req, res) {
	const pn = parseInt(req.query.pn)
	const limit = 15
	const user = req.user
	
	const list = await UserFeed.find({user})
		.populate({path: 'feed', populate: 'origin'})
		.sort({createAt: -1})
		.skip(limit * pn)
		.limit(limit)

	res.json({
		code: 0,
		list
	})
}

//todo 