const User = require('../models/User')
const Feed = require('../models/Feed')
const UserFeed = require('../models/UserFeed')
const Snapshot = require('../models/Snapshot')
const FeedItem = require('../models/FeedItem')

const settings = require('../config/settings.js')
const Enums = require('../lib/enums')
const redis = require('../lib/redis')
const getCtx = require('../lib/ctx')
const {FeedOriginTypes} = Enums

const FeedOriginCodeToFunc = {
	'fanju': {
		route: '../../routes/bilibili/bangumi',
	},
	'bi1001': {
		route: '../../routes/bilibili/article',
	},
	'bitest1': {
		route: '../../routes/bilibili/dynamic.js'
	},
	'weibohot': {
		route: '../../routes/weibo/search/hot.js'
	},
	'zhihuhot': {
		route: '../../routes/zhihu/hotlist.js'
	}
}

const feedMapTypes = {
	updated: 1,
	notUpdated: 2
}

async function main() {
	console.log('start ----------------------')
	const startTime = Date.now()
	const nextStartTime = startTime + settings.crawlInterval * 1000
	const snapshot = new Snapshot({
		startTime
	})
	await snapshot.save()

	const feedCacheMap = {}  // todo redis

	const userCount = await User.count()
	const interval = 100
	for (let i = 0; (i * interval) < userCount; i++) {
		const users = await User.find().skip(i * interval).limit(interval)
		for (let user of users) {
			const tasks = await UserFeed.find({ user })
			const taskUpdatedFeeds = []

			for (let task of tasks) {
			
				if (feedCacheMap[task.origin] === feedMapTypes.updated) {
					 //todo 
					const feed = await Feed.findById(task.feed).lean()
					taskUpdatedFeeds.push(feed)
				} else if (!feedCacheMap[task.origin]) {
					const feed = await Feed.findById(task.feed)
					const res = await handleCrawl(feed)
					const updateTime = await handleFeedRes(feed, res, snapshot)

					if (updateTime) {
						feed.lastUpdate = updateTime
						feed.lastSnapshot = snapshot
					}
					feed.lastFetch = Date.now()
					await feed.save()

					const isUpdated = !!updateTime
					if (isUpdated) {
						taskUpdatedFeeds.push(feed)
					}
					feedCacheMap[feed._id] = isUpdated ? feedMapTypes.updated : feedMapTypes.notUpdated
				}
			}

			// todo push
			console.log('push', taskUpdatedFeeds)
		}
	}
	
	snapshot.userCount = userCount
	snapshot.feedCount = Object.keys(feedCacheMap).length
	snapshot.endTime = Date.now()
	await snapshot.save()

	const t = nextStartTime - Date.now()
	if (t > 0) {
		setTimeout(main, t)
	} else {
		main()
	}
}

/**
 * 
 * @param {Object} feed 
 * @returns {Object}
 */
async function handleCrawl (feed) {
	const {params} = feed
	const p = params.reduce((obj, {key, value}) => {
		obj[key] = value
		return obj
	}, {})

	const ctx = getCtx({
		params: p,
		query: {},
	})

	// console.log(feed)
	const handler = require(FeedOriginCodeToFunc[feed.originCode].route)
	await handler(ctx)

	// console.log(ctx.state.data)
	return ctx.state.data
}

/**
 * 
 * @param {Array} oldItems 
 * @param {Array} newItems 
 * @returns {boolean}
 */
function compareFeedItems (oldItems, newItems) {
	if (!oldItems.length) {
		return newItems
	}
	
	const getKey = ({title = '', link = '', desc = ''}) => title + link + desc.slice(0, 10)
	const map = oldItems.reduce((obj, item) => {
		obj[getKey(item)] = true
		return obj
	}, {})

	return newItems.filter(item => !map[getKey(item)])
}	

/**
 * 
 * @param {Object} feed 
 * @param {Object} feedRes 
 * @param {Object} snapshot
 * @returns {Date}
 */
async function handleFeedRes (feed, feedRes, snapshot) {
	let time = null
	const {item: newItems} = feedRes

	if (newItems.length) {
		if (feed.originType === FeedOriginTypes.diff) {
			const findOne = await FeedItem.findOne({feed, snapshot: feed.lastSnapshot}).lean()
			const oldItems = findOne ? findOne.items : []
			const diffItems = compareFeedItems(oldItems, newItems)
			// console.log(diffItems.length, oldItems.length)
			if (diffItems.length) {
				time = Date.now()
				const feedItemRecord = new FeedItem({
					feed,
					snapshot,
					feedSnapshot: feed._id + snapshot._id,
					feedType: feed.type,
					items: newItems
				})
				await feedItemRecord.save()
			}
		} else {
			const i = newItems[0]
			const oldItems = await FeedItem.find({feed}).lean()  // todo 数据量大的时候拆分
			const diffItems = compareFeedItems(newItems, oldItems)

			// console.log(i, new Date(i.pubDate) > new Date(feed.lastUpdate))
			if (i.pubDate &&  new Date(i.pubDate) > new Date(feed.lastUpdate)) {
				time = i.pubDate
			} else if (!i.pubDate) {
				if (diffItems.length) {
					time = Date.now()
				}
			}

			if (time) {
				const feedItems = diffItems.map(item => new FeedItem({
					feed,
					snapshot,
					feedSnapshot: feed._id + snapshot._id,
					feedType: feed.type,
					...item
				}))
				await FeedItem.update(feedItems)
			}
		}
	}
	return time
}


module.exports = main