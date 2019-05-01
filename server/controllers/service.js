const redis = require('../lib/redis')
const Enums = require('../lib/enums')

const User = require('../models/User')
const Feed = require('../models/Feed')
const UserCollect = require('../models/UserCollect')
const FeedItem = require('../models/FeedItem')
const UserSnapshot = require('../models/UserSnapshot')
const UserFeedItem = require('../models/UserFeedItem.js')

module.exports.userService = {
	getUserFormId: async (uid) => {
		const key = Enums.RedisKeys.userFormIds(uid)

		let formId = null
		const listStr = await redis.get(key)
		if (listStr) {
			const list = JSON.parse(listStr)
			const findIndex = list.findIndex(obj => obj.expireAt > Date.now())
			if (findIndex > -1) {
				formId = list[findIndex].formId
			}
			const leftList = findIndex > -1 ? list.slice(findIndex + 1) : ''
			await redis.set(key, JSON.stringify(leftList))
		}
		return formId
	},
	setUserFormId: async (uid, formIds) => {
		const key = Enums.RedisKeys.userFormIds(uid)
		const listStr = await redis.get(key)
		const list = JSON.parse(listStr) || []
		for (let formId of formIds) {
			const expireAt = Date.now() + (7 * 24 * 60 * 60) * 1000
			list.push({
				formId,
				expireAt
			})
		}
		const expire = (7 * 24 * 60 * 60 - 2 * 60) * 1000
		await redis.set(key, JSON.stringify(list), 'PX', expire)
	},
	getUserCollections: async function (uid) {
		const redisKey = Enums.RedisKeys.userCollections(uid.toString())
		const cache = JSON.parse(await redis.get(redisKey))
		if (cache) {
			return cache
		}

		const collections = await UserCollect.findOne({user: uid}).lean()
		const cacheStr = JSON.stringify(collections)
		await redis.set(redisKey, cacheStr, 'EX', 24 * 60 * 60)
		return collections
	},
	addUserCollections: async function (uid, feedItem) {
		const redisKey = Enums.RedisKeys.userCollections(uid.toString())
		await redis.del(redisKey)

		const newRecord = new UserCollect({
			user: uid,
			feedItem
		})
		await newRecord.save()
	},
	delUserCollections: async function (uid, itemId) {
		const redisKey = Enums.RedisKeys.userCollections(uid.toString())
		await redis.del(redisKey)

		await UserCollect.remove({_id: itemId})
	},

}



module.exports.feedService = {
	safeQuerySelect: '-lastItems -routePath -updateInterval -subscribedCount -params -signatureStr',
	afterSubscribeFeed: async (userfeed) => {
		const {user, feed} = userfeed
		const feedRecord = await Feed.findById(feed)
		
		feedRecord.subscribedCount ++
		await feedRecord.save()
		await User.update({_id: user}, {
			$inc: {
				subscribeCount: 1
			}
		})
	},
	afterUnsubscribeFeed: async (userfeed) => {
		const {user, feed} = userfeed
		
		await User.update({_id: user}, {
			$inc: {
				subscribeCount: -1
			}
		})

		const userfeedItems = await UserFeedItem.find({user, feed}).lean()
		const userfeedItemIds = [], feedItemsIds = []
		for (let userfeedItem of userfeedItems) {
			userfeedItemIds.push(userfeedItem._id)
			feedItemsIds.push(userfeedItem.feedItem)
		}

		await UserFeedItem.remove({_id: {$in: userfeedItemIds}})
		await FeedItem.updateMany({_id: {$in: feedItemsIds}}, {
			$inc: {
				refCount: -1
			}
		})

		const feedRecord = await Feed.findById(feed)
		feedRecord.subscribedCount --
		if (feedRecord.subscribedCount === 0) {
			await feedRecord.remove()
			await FeedItem.remove({
				feed: feedRecord._id,
				collectedCount: 0
			})
		} else {
			await feedRecord.save()
		}

	}
}


const feedOriginSelectStr = '-routePath -updateInterval -stop'
module.exports.feedOriginService = {
	safeQuerySelectStr: feedOriginSelectStr,
	safeSelectFeedOriginItem: (item) => {
		const keys = feedOriginSelectStr.split('-').filter(i => !!i).map(i => i.trim())
		keys.forEach(key => {
			item[key] = undefined
		})
		return item
	}
}