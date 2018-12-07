const User = require('../models/User')
const Feed = require('../models/Feed')
const UserFeed = require('../models/UserFeed')
const Snapshot = require('../models/Snapshot')
const FeedItem = require('../models/FeedItem')

const settings = require('../config/settings.js')
const Enums = require('../lib/enums')
const redis = require('../lib/redis')

const {FeedOriginTypes} = Enums

const FeedOriginCodeToFunc = {
	'fanju': require('../../routes/bilibili/bangumi'),
	'bi1001': require('../../routes/bilibili/article')
}

const feedMapTypes = {
	updated: 1,
	notUpdated: 2
}

async function main() {
	const taskCount = await UserFeed.count()
	const startTime = new Date()
	const snapshot = new Snapshot({
		startTime
	})
	await snapshot.save()

	const feedCacheMap = {}

	const userCount = await User.count()
	const interval = 100
	for (let i = 0; (i * interval) < userCount; i++) {
		const users = await User.find().skip(i * interval).limit(interval)
		for (let user of users) {
			const tasks = UserFeed.find({ user })
			const taskUpdatedFeeds = []

			for (let task of tasks) {
			
				if (feedCacheMap[task.origin] === feedMapTypes.updated) {
					 //todo 
					const feed = await Feed.findById(task.origin).lean()
					taskUpdatedFeeds.push(feed)
				} else if (!feedCacheMap[task.origin]) {
					const taskFunc = FeedOriginCodeToFunc[task.originCode]
					const res = await taskFunc() //todo
					const feed = await Feed.findById(task.origin)
					const updateTime = getUpdateTime(feed, res)

					if (updateTime) {
						feed.lastUpdate = updateTime
					}
					feed.lastFetch = Date.now()
					feed.lastSnapshot = snapshot
					await feed.save()

					feedCacheMap[feed._id] = updateTime ? feedMapTypes.updated : feedMapTypes.notUpdated
				}
			}
		}
	}

	snapshot.userCount = userCount
	snapshot.feedCount = Object.keys(feedCacheMap).length
	snapshot.endTime = Date.now()
	await snapshot.save()
}

function compareFeedItems (oldItems, newItems) {
	if (!oldItems.length || !newItems.length) {
		return []
	}
	
	const obj = oldItems.reduce((obj, item) => {
		obj[item.title] = true
		return obj
	}, {})

	return newItems.filter(item => !obj[item.title])
}	

async function getUpdateTime (feed, feedRes) {
	let time = null
	const {item: newItems} = feedRes

	if (newItems.length) {
		if (feed.originType === FeedOriginTypes.diff) {
			const findOne = await FeedItem.findOne({feed, snapshot: feed.snapshot}).lean()
			const oldItems = findOne ? findOne.items : []
			const diffItems = compareFeedItems(oldItems, newItems)
			if (diffItems.length) {
				time = Date.now()
			}
		} else {
			const i = newItems[0]
			if (i.pubData) {
				time = i.pubData
			} else {
				const oldItems = await FeedItem.find({feed}).lean()  // todo 数据量大的时候拆分
				const diffItems = compareFeedItems(newItems, oldItems)
				if (diffItems.length) {
					time = Date.now()
					// todo save
				}
			}
		}
	}
	return time
}


module.exports = main