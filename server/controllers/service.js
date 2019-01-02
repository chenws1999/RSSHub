const redis = require('../lib/redis')
const Enums = require('../lib/enums')

const User = require('../models/User')
const Feed = require('../models/Feed')
const UserCollect = require('../models/UserCollect')
const FeedItems = require('../models/FeedItem')
const UserSnapshot = require('../models/UserSnapshot')
const UserFeedItem = require('../models/UserFeedItem.js')

module.exports.userService = {
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
	}
}


module.exports.feedService = {
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
		const feedRecord = await Feed.findById(user)
		
		await User.update({_id: user}, {
			$inc: {
				subscribeCount: -1
			}
		})
		feedRecord.subscribedCount --
		if (feedRecord.subscribedCount === 0) {
			await feedRecord.remove()
			await UserFeedItem.remove({
				user,
				feed
			})

			//todo del feeditem
		} else {
			await feedRecord.save()
		}

	}
}