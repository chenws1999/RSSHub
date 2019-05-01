const Redis = require('ioredis')
const request = require('request-promise-native')

const User = require('../models/User')
const FeedOrigin = require('../models/FeedOrigin')
const Feed = require('../models/Feed')
const UserFeed = require('../models/UserFeed')
const UserSnapshot = require('../models/UserSnapshot')
const FeedItem = require('../models/FeedItem')
const UserCollect = require('../models/UserCollect')
const UserFeedItem = require('../models/UserFeedItem')

const getCtx = require('../lib/ctx')
const settings = require('../config/settings.js')
const Enums = require('../lib/enums')
const redis = require('../lib/redis')
const DecryptWxData = require('../lib/wxbizdatacrypt')
const { feedService, feedOriginService, userService } = require('./service')
const { RedisKeys, FeedOriginPriorityTypes, FeedOriginParamTypes } = Enums

const global = {
	feedOriginTree: {}
}

function getLeftSecondsOfDay () {
	const now = Date.now()
	const todayOut = now % (3600 * 24 * 1000)
	const todayLeft = (3600 * 16 * 1000) - todayOut
	return Math.ceil(todayLeft / 1000)
}

function generateFeedSignatureStr(origin, params = []) {
	return origin._id + '?' + (params.map(obj => `${obj.key}=${obj.value}`).join('&'))
}

function generateFeedSignatureStrByObj(origin, params = {}) {
	return origin._id + '?' + (Object.entries(params).map(([key, value]) => `${key}=${value}`).join('&'))
}


async function getFeedOriginTree() {
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
	res.json({ code: -1, msg: err.message || 'server error' })
	// console.log(err)
}

exports.getFeedOriginItem = async function (req, res) {
	const { originId } = req.query

	const origin = await FeedOrigin.findById(originId).select(feedOriginService.safeQuerySelectStr).lean()

	res.json({
		code: 0,
		feedOrigin: origin
	})
}

exports.getFeedOriginListV2 = async function (req, res) {
	const limit = 10
	const { position } = req.query
	const user = req.user

	const myFeeds = await UserFeed.find({ user }).lean()
	const myFeedIdMap = myFeeds.reduce((obj, userFeed) => {
		obj[userFeed.feedOrigin] = userFeed._id
		return obj
	}, {})

	const query = {
		priority: Enums.FeedOriginPriorityTypes.second
	}
	if (position) {
		query.createAt = {
			$lt: position
		}
	}

	const list = await FeedOrigin.find(query).sort({createAt: -1}).limit(limit).lean()
	let nextPosition = null
	list.forEach((item, index) => {
		if (index === list.length - 1) {
			nextPosition = item.createAt
		}
		const isImmutable = !item.params || item.params.length === 0
		const userFeedId = myFeedIdMap[item._id]
		if (isImmutable && userFeedId) {
			item.userFeedId = userFeedId
		}
		item.isImmutable = isImmutable
		feedOriginService.safeSelectFeedOriginItem(item)
	})
	res.json({
		code: 0,
		position: nextPosition,
		list,
	})
}

exports.getFeedOriginList = async function (req, res) {
	const limit = 10
	const { after } = req.query
	const user = req.user

	const myFeeds = await UserFeed.find({ user })
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

exports.preCheckSubscribe = async function (req, res) {
	const {feedOriginId, paramsObj} = req.query
	//todo redis cache
	console.log(feedOriginId, paramsObj)
	const feedOrigin = await FeedOrigin.findById(feedOriginId).lean()
	if (!feedOrigin) {
		throw new Error('无效的订阅源')
	}

	const signatureStr = generateFeedSignatureStrByObj(feedOrigin, paramsObj)
	const findFeed = await Feed.findOne({signatureStr}).lean()
	if (findFeed) {
		return res.json({
			code: 0,
			info: {
				title: findFeed.title
			}
		})
	}
	
	const ctx = getCtx({
		query: {},
		params: paramsObj
	})
	const handler = require('../../routes/' + feedOrigin.routePath)
	try {
		await handler(ctx)
	} catch (e) {
		console.log(e)
		return res.json({
			coee: -1,
			msg: '请求错误'
		})
	}
	const {title} = ctx.state.data
	return res.json({
		code: 0,
		info: {
			title
		}
	})
}

const getPickerValue = (rangeArr, pickerValue) => {
	if (!rangeArr || !rangeArr.length || !pickerValue || !pickerValue.length) {
		return null
	}
	const index = pickerValue.shift()
	const findOne = rangeArr[index]
	if (!findOne) {
		return null
	}
	if (findOne.children) {
		return getPickerValue(findOne.children, pickerValue)
	} else {
		return findOne
	}
}



exports.subscribeFeed = async function (req, res) {
	const { originId, userFeedId, name, postParams = [] } = req.body
	const user = req.user
	const feedOrigin = await FeedOrigin.findById(originId)

	if (!feedOrigin) {
		throw new Error('无效的订阅源')
	}
	if (feedOrigin.priority === Enums.FeedOriginPriorityTypes.main) {
		throw new Error('暂不支持订阅一级源')
	}

	if (!userFeedId && (user.subscribeCount >= settings.subscribeLimit && !settings.whiteUserList.includes(user._id.toString())) ){
		throw new Error('超过订阅上限')
	}

	const params = []
	const needParams = !!(feedOrigin.params && feedOrigin.params.length)
	if (needParams) {
		feedOrigin.params.forEach(obj => {
			const { key, name, paramType, range } = obj
			const postValue = postParams[key]
			let value = postValue
			if (!postValue) {
				throw new Error('字段缺失: ' + name)
			}
			if ([FeedOriginParamTypes.multiSelect, FeedOriginParamTypes.select].includes(paramType)) {
				const findOne = getPickerValue(range, postValue)
				if (!findOne) {
					throw new Error(`${name}字段的值无效`)
				}
				value = findOne.value
			}
			params.push({
				value,
				key,
				name
			})
		})
	}

	const signatureStr = generateFeedSignatureStr(feedOrigin, params)
	let feed = await Feed.findOne({ origin: feedOrigin, signatureStr })
	if (!feed) {
		feed = new Feed({
			origin: feedOrigin,
			originCode: feedOrigin.code,
			originType: feedOrigin.type,
			originName: feedOrigin.name,
			fetchStatus: Enums.FeedFetchStatus.new,
			params,
			signatureStr,
			icon: feedOrigin.icon,
			routePath: feedOrigin.routePath,
			updateInterval: feedOrigin.updateInterval
		})
		await feed.save()
	}

	let oldRecord = null
	if (userFeedId) {
		oldRecord = await UserFeed.findOne({ _id: userFeedId, user })
		if (!oldRecord) {
			throw new Error('无效的参数')
		}
	}

	let record = null
	const findRecord = await UserFeed.findOne({ feed, user })
	if (findRecord) {
		if (findRecord._id.toString() === userFeedId) {
			record = findRecord
		} else {
			throw new Error('已订阅该源 请勿重复订阅')
		}
	}
	if (!record) {
		record = new UserFeed({})
	}
	Object.assign(record, {
		originCode: feed.originCode,
		feedOrigin: feed.origin,
		userfeed: user._id + feed._id,
		user,
		feed,
		name: name || feedOrigin.name,
		nextFetch: feed.nextFetch
	})
	await record.save()
	await feedService.afterSubscribeFeed(record)

	if (oldRecord && record._id.toString() !== oldRecord._id.toString()) {
		await oldRecord.remove()
		await feedService.afterUnsubscribeFeed(record)
	}

	res.json({
		code: 0,
		userFeed: record
	})
}

exports.unsubscribeFeed = async function (req, res) {
	const { userFeedId, feedId } = req.body
	const user = req.user

	const query = userFeedId ? { _id: userFeedId } : { feed: feedId, user }
	const userFeed = await UserFeed.findOne(query)
	if (!userFeed) {
		throw new Error('无效参数')
	}
	if (userFeed.user._id.toString() !== user._id.toString()) {
		throw new Error('越权操作')
	}
	await userFeed.remove()
	await feedService.afterUnsubscribeFeed(userFeed)

	res.json({
		code: 0,
	})
}


exports.getPushFeedItemList = async function (req, res) {
	const { position } = req.query
	const query = {
		user: req.user,
	}
	if (position) {
		query.pubDate = {
			$lt: position
		}
	}
	const list = await UserFeedItem.find(query).sort({ pubDate: -1 }).limit(15).populate('feedItem')
	// const list = await FeedItem.find({user: req.user}).limit(10)
	// list[0].feedItem.imgs = ['https://ss0.baidu.com/7Po3dSag_xI4khGko9WTAnF6hhy/image/h%3D300/sign=f2db86688ccb39dbdec06156e01709a7/2f738bd4b31c87018e9450642a7f9e2f0708ff16.jpg',
	// 'https://ss0.baidu.com/7Po3dSag_xI4khGko9WTAnF6hhy/image/h%3D300/sign=f2db86688ccb39dbdec06156e01709a7/2f738bd4b31c87018e9450642a7f9e2f0708ff16.jpg',
	// 'https://ss0.baidu.com/7Po3dSag_xI4khGko9WTAnF6hhy/image/h%3D300/sign=f2db86688ccb39dbdec06156e01709a7/2f738bd4b31c87018e9450642a7f9e2f0708ff16.jpg']
	res.json({
		code: 0,
		list,
		position: list.length ? list[list.length - 1].pubDate : null
	})
}

exports.getPushRecordList = async function (req, res) {
	const { position } = req.query
	// const unread = parseInt(req.query.unread)
	const limit = 5
	const user = req.user

	const query = { user }
	if (position) {
		query.pushTime = {
			$lt: position
		}
	}

	const list = await UserSnapshot.find(query).sort({ pushTime: -1 }).limit(limit)
	res.json({
		code: 0,
		list,
		position: list.length ? list[list.length - 1].pushTime : null
	})
}



exports.readPushRecord = async function (req, res) {
	const user = req.user
	const { recordId } = req.body

	if (recordId) {
		const record = await UserSnapshot.findById(recordId)
		if (!record || (record.user._id.toString() !== user._id.toString())) {
			throw new Error('无效或越权操作')
		}
		record.unread = 0
		await record.save()
	} else {
		// const unreadRecords = await UserSnapshot.find({user, unread: 1})
		// unreadRecords.forEach(record => record.unread = 0)
		// console.log(unreadRecords)
		await UserSnapshot.updateMany({ user, unread: 1 }, { unread: 0 })
	}

	res.json({
		code: 0,
	})
}


exports.getFeedItemList = async function (req, res) {
	const user = req.user
	const { feedId, position } = req.query
	const limit = 10

	const userFeed = await UserFeed.findOne({ feed: feedId, user })
		.populate({path: 'feed', select: feedService.safeQuerySelect})

	let list = []
	if (userFeed) {
		const query = {
			feed: feedId,
			user
		}
		if (position) {
			query.pubDate = {
				$lt: position
			}
		}
		list = await UserFeedItem.find(query).sort({ pubDate: -1 })
			.limit(limit)
			.populate('feedItem')
	}

	res.json({
		code: 0,
		userFeed,
		list,
		position: list.length ? list[list.length - 1].pubDate : null
	})
}

exports.getRegistetCode = async (req, res) => {
	const { email } = req.body
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
	const { code, profileData,  } = req.body
	const {encryptedData, iv} = profileData
	if (!code || !encryptedData || !iv) {
		throw new Error('无效数据')
	}
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
		console.error('wx server error: ' + wxRes.errcode + wxRes.errmsg)
		throw new Error('授权错误')
		// throw new Error('wx server error: ' + wxRes.errcode + wxRes.errmsg)
	}

	const { openid: openId, session_key: sessionKey } = wxRes
	req.session.sessionKey = sessionKey
	const DecryptWxDataUtil = new DecryptWxData(settings.appId, sessionKey)
	const {nickName, gender, city, province, country, avatarUrl} = DecryptWxDataUtil.decryptData(encryptedData, iv)


	let user = await User.findOne({ openId })
	if (!user) {
		user = new User({
			openId,
		})
	}
	Object.assign(user, {
		name: nickName,
		gender,
		headImg: avatarUrl,
		city,
		province,
		country,
	})
	await user.save()
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


exports.getBaseInfo = async (req, res) => {
	const user = req.user
	const isCheckIn = await redis.get(Enums.RedisKeys.userCheckStatus(req.user._id))

	res.json({
		code: 0,
		user,
		isCheckIn: !!isCheckIn
		// _csrf: req.csrfToken()
	})
}

exports.getHomeInfo = async (req, res) => {
	const user = req.user
	
	const messageUpdateTimeKey = Enums.RedisKeys.userMessageUpdateTime(user._id)
	const messageTime = await redis.get(messageUpdateTimeKey)

	res.json({
		code: 0,
		user,
		lastMessageTime: messageTime
	})
}



exports.getOverview = async (req, res) => {
	const user = req.user

	const newlyPushRecord = await UserSnapshot.findOne({ user }).sort({ createAt: -1 }).lean()
	const unreadCount = await UserSnapshot.countDocuments({ user, unread: 1 })
	const feedList = await await UserFeed.find({ user })
		.populate({ path: 'feed', populate: 'origin' })
		.sort({ createAt: -1 })
		.lean()

	res.json({
		code: 0,
		newlyPushRecord,
		unreadCount,
		feedList,
	})
}


exports.getMyFeedList = async function (req, res) {
	const user = req.user

	const list = await UserFeed.find({ user })
		.populate({ path: 'feed', populate: 'origin', select: feedService.safeQuerySelect })
		.sort({ createAt: -1 })

	res.json({
		code: 0,
		list
	})
}

exports.getMyCollectList = async function (req, res) {
	const { position } = req.query
	const query = {
		user: req.user,
	}
	if (position) {
		query.createAt = {
			$lt: position
		}
	}
	const list = await UserCollect.find(query).sort({ createAt: -1 }).limit(15).populate('feedItemId')
	// const list = await FeedItem.find({user: req.user}).limit(10)
	// list[0].feedItem.imgs = ['https://ss0.baidu.com/7Po3dSag_xI4khGko9WTAnF6hhy/image/h%3D300/sign=f2db86688ccb39dbdec06156e01709a7/2f738bd4b31c87018e9450642a7f9e2f0708ff16.jpg',
	// 'https://ss0.baidu.com/7Po3dSag_xI4khGko9WTAnF6hhy/image/h%3D300/sign=f2db86688ccb39dbdec06156e01709a7/2f738bd4b31c87018e9450642a7f9e2f0708ff16.jpg',
	// 'https://ss0.baidu.com/7Po3dSag_xI4khGko9WTAnF6hhy/image/h%3D300/sign=f2db86688ccb39dbdec06156e01709a7/2f738bd4b31c87018e9450642a7f9e2f0708ff16.jpg']
	res.json({
		code: 0,
		list,
		position: list.length ? list[list.length - 1].pubDate : null
	})
}



exports.collectFeedItem = async function (req, res) {
	const { feedItemId, userFeedItemId } = req.body
	const user = req.user
	if (!feedItemId || !userFeedItemId) {
		throw new Error('提交数据有误')
	}
	const userFeedItem = await UserFeedItem.findById(userFeedItemId)
	if (!userFeedItem) {
		throw new Error('提交数据有误')
	}

	const newRecord = new UserCollect({
		user,
		feedItemId,
		userFeedItem: userFeedItemId,
		feedOriginType: userFeedItem.feedOriginType,
		feedIcon: userFeedItem.feedIcon, //头像地址
		feedName: userFeedItem.feedName,
		uniqueKey: user._id + feedItemId
	})
	await newRecord.save()
	await FeedItem.updateOne({ _id: feedItemId }, {
		$inc: {
			collectedCount: 1
		}
	})
	await User.updateOne({ _id: user._id }, {
		$inc: {
			collectCount: 1
		}
	})
	await UserFeedItem.updateOne({ _id: userFeedItemId }, {
		$set: {
			userCollectId: newRecord
		}
	})
	return res.json({
		code: 0,
		item: newRecord
	})
}

exports.deleteCollectItem = async function (req, res) {
	const { userCollectId } = req.body
	if (!userCollectId) {
		throw new Error('提交数据有误')
	}

	const user = req.user
	const item = await UserCollect.findById(userCollectId)
	if (!item) {
		throw new Error('目标不存在')
	}
	await item.remove()

	await User.updateOne({ _id: user._id }, {
		$inc: {
			collectCount: -1
		}
	})
	await FeedItem.updateOne({ _id: item.feedItemId }, {
		$inc: {
			collectedCount: -1
		}
	})
	await UserFeedItem.updateOne({ _id: item.userFeedItem }, { userCollectId: null })
	return res.json({
		code: 0
	})
}
exports.userCheckIn = async function (req, res) {
	const { formIds } = req.body
	// if (!formIds) {
	// 	throw new Error('无效数据')
	// }
	// const isCheckIn = await redis.get(Enums.RedisKeys.userCheckStatus(req.user._id))
	const checkInKey = Enums.RedisKeys.userCheckStatus(req.user._id)
	await redis.set(checkInKey, 1, 'Ex', getLeftSecondsOfDay())
	await userService.setUserFormId(req.user._id, formIds)
	// const {sendTemplate} = require('../lib/wechat')
	// const flag = await sendTemplate({
	// 	templateId: settings.templateId,
	// 	openId: req.user.openId,
	// 	// openId: 'ovfMO0cZbKbWjDixj2RybEoneLsU',
	// 	formId,
	// 	data: {
	// 		keyword1: {
	// 			value: 'test'
	// 		},
	// 		keyword2: {
	// 			value: 'test3'
	// 		}
	// 	}
	// })
	// console.log(flag, 'push')
	res.json({
		code: 0
	})
}


exports.recieveFormId = async function (req, res) {
	const { formIds } = req.body
	if (!formIds) {
		throw new Error('无效数据')
	}
	await userService.setUserFormId(formIds)
	// const {sendTemplate} = require('../lib/wechat')
	// const flag = await sendTemplate({
	// 	templateId: settings.templateId,
	// 	openId: req.user.openId,
	// 	// openId: 'ovfMO0cZbKbWjDixj2RybEoneLsU',
	// 	formId,
	// 	data: {
	// 		keyword1: {
	// 			value: 'test'
	// 		},
	// 		keyword2: {
	// 			value: 'test3'
	// 		}
	// 	}
	// })
	// console.log(flag, 'push')
	res.json({
		code: 0
	})
}
//todo 


//todo 设置whitelist 用户访问频率限制
exports.fetchCrosFile = async function (req, res) {
	const { src } = req.query
	if (!src) {
		throw new Error('资源无效')
	}
	const resFile = await request(src, {
		encoding: null,
		resolveWithFullResponse: true
	})
	// console.log(Object.keys(resFile), resFile.headers)
	res.header('Content-Type', resFile.headers['content-type'])
	res.send(resFile.body)
	// res.json({
	// 	code: 0
	// })
}