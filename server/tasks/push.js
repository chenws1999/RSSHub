const request = require('request-promise-native')

const User = require('../models/User')
const Feed = require('../models/Feed')
const UserFeed = require('../models/UserFeed')
const Snapshot = require('../models/Snapshot')
const FeedItem = require('../models/FeedItem')
const UserSnapshot = require('../models/UserSnapshot')
const UserFeedItem = require('../models/UserFeedItem')

const {sendTemplate} = require('../lib/wechat')
const settings = require('../config/settings')

const getIdStr = (item) => {
	if (typeof item === 'object' && item._id) {
		return item._id.toString()
	}
	return item.toString()
}

async function main (user, snapshot, feedList, feedItemList) {
	const idList = feedList.map(feed => feed._id)
	const validUserFeeds = await UserFeed.find({user, feed: {$in: idList}}).lean()
	const validFeeds = []
	feedList.forEach(feed => {
		const userFeed = validUserFeeds.find(o => o.feed.toString() === feed._id.toString())
		if (userFeed) {
			validFeeds.push({
				lastUpdate: feed.lastUpdate,
				lastFetch: feed.lastFetch,
				lastSnapshot: feed.lastSnapshot,
				lastUpdateCount: feed.lastUpdateCount,
				feed: feed._id,
				name: userFeed.name || feed.originName
			})
		}
	})
	if (validFeeds.length) {
		const userSnapshot = new UserSnapshot({
			user,
			snapshot,
			userSnapshot: user._id + snapshot._id,
			feeds: validFeeds,
		})
		await userSnapshot.save()
	}

	const userFeedItems = []
	const validFeedItemIds = []
	feedItemList.forEach(feedItem => {
		const findOne = validFeeds.find(obj => {
			// console.log(obj.feed, feedItem.feed, feedItem)
			console.log(getIdStr(obj.feed), getIdStr(feedItem.feed), getIdStr(obj.feed)=== getIdStr(feedItem.feed) )
			return getIdStr(obj.feed) === getIdStr(feedItem.feed)
		})
		if (findOne) {
			userFeedItems.push({
				user,
				feed: feedItem.feed,
				feedItem: feedItem._id,
				pubDate: feedItem.pubDate,
				unique: user._id + feedItem._id,
				snapshot
			})
			validFeedItemIds.push(feedItem._id.toString())
		}
		return false
	})

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