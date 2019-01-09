const request = require('request-promise-native')

const User = require('../models/User')
const Feed = require('../models/Feed')
const UserFeed = require('../models/UserFeed')
const Snapshot = require('../models/Snapshot')
const FeedItem = require('../models/FeedItem')
const UserSnapshot = require('../models/UserSnapshot')
const UserFeedItem = require('../models/UserFeedItem')

const {RedisKeys} = require('../lib/enums')
const {sendTemplate} = require('../lib/wechat')
const settings = require('../config/settings')
const redis = require('../lib/redis')

const getIdStr = (item) => {
	if (typeof item === 'object' && item._id) {
		return item._id.toString()
	}
	return item.toString()
}


//todo 加数据库锁
async function main (user, snapshot, feedList, feedItemList) {
	const idList = feedList.map(feed => feed._id)
	const validUserFeeds = await UserFeed.find({user, feed: {$in: idList}}).lean()
	
	const validPushFeeds = []
	const userFeedItems = []
	const validFeedItemIds = []
	feedList.forEach((feed, index) => {
		const userFeed = validUserFeeds.find(o => o.feed.toString() === feed._id.toString())
		if (userFeed) {
			validPushFeeds.push({
				lastUpdate: feed.lastUpdate,
				lastFetch: feed.lastFetch,
				lastSnapshot: feed.lastSnapshot,
				lastUpdateCount: feed.lastUpdateCount,
				icon: feed.icon,
				feed: feed._id,
				name: userFeed.name || feed.originName
			})
			const feedItems = feedItemList[index]
			feedItems.forEach(feedItem => {
				const userFeedItem = new UserFeedItem({
					user,
					snapshot,
					feed,
					feedItem: feedItem._id,
					pubDate: feedItem.pubDate,
					unique: user._id + feedItem._id,
					feedOriginType: feed.originType,
					feedIcon: feed.icon,
					feedName: userFeed.name || feed.name
				})
				userFeedItems.push(userFeedItem)
				validFeedItemIds.push(feedItem._id)
			})
		}
	})
	if (validPushFeeds.length) {
		const userSnapshot = new UserSnapshot({
			user,
			snapshot,
			userSnapshot: user._id + snapshot._id,
			feeds: validPushFeeds,
		})
		await userSnapshot.save()
		await redis.set(RedisKeys.userMessageUpdateTime(user._id), Date.now(), 'EX', 3600 * 24 * 5)
		
	}

	console.log(userFeedItems.length, 'length')
	if (userFeedItems.length) {
		await UserFeedItem.create(userFeedItems)
		const res1 = await FeedItem.updateMany({_id: {
			$in: validFeedItemIds
		}}, {
			$inc: {
				refCount: 1
			}
		})
		console.log(validFeedItemIds, 'validfeeditems', res1)
	}
	// await sendTemplate({  // todo
	// 	templateId: settings.templateId,
	// 	openId: user.openId,
	// 	page: 'pages/index/index',
	// 	formId: '',
	// 	data: {}
	// })
}


module.exports = main