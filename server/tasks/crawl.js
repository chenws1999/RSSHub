const cherrio = require('cheerio')

const User = require('../models/User')
const Feed = require('../models/Feed')
const UserFeed = require('../models/UserFeed')
const Snapshot = require('../models/Snapshot')
const FeedItem = require('../models/FeedItem')

const settings = require('../config/settings.js')
const Enums = require('../lib/enums')
const redis = require('../lib/redis')
const getCtx = require('../lib/ctx')
const pushToUser = require('./push')
require('../lib/db')
const { FeedOriginTypes, RedisKeys, FeedFetchStatus } = Enums

const feedMapTypes = {
	updated: 1,
	notUpdated: 2,
	pendding: 3,
}


const threadCount = 10 // 并发请求数
const queryUserLimit = 100 //一次性从数据库中请求的用户数

const mockPendding = (time = 1000) => {
	return new Promise((resolve) => {
		setTimeout(_ => {
			resolve()
		}, time)
	})
}

async function main() {
	console.log('start ----------------------' + new Date())
	const startTime = Date.now()
	const nextStartTime = startTime + settings.crawlInterval * 1000
	const snapshot = new Snapshot({
		startTime
	})
	await snapshot.save()
	const feedCacheMap = {}  // todo redis
	const feedNextUpdateTimeCache = {}
	const feedUpdatedItemsCache = {}

	const userCount = await User.countDocuments()
	let resolvedUser = 0
	let cursor = -1
	let leftThreadCount = threadCount

	console.log('user count:', userCount)
	const afterFeedPendding = (feedId) => {
		let time = 0
		return new Promise((resolve, reject) => {
			const func = () => {
				if (feedCacheMap[feedId] !== feedMapTypes.pendding) {
					return resolve(feedCacheMap[feedId])
				}
				time ++
				if (time >= 6) {
					reject(new Error('等待超时'))
				} else {
					setTimeout(func, 1000)
				}
			}
			func()
		})
	} 

	const handleUserFeedTask = async (task, taskUpdatedFeeds = [], taskUpdatedFeedItems = []) => {
		try {

			let cacheType = feedCacheMap[task.feed.toString()]
			if (cacheType === feedMapTypes.pendding) {
				console.log(`feedid ${task.feed} request pendding`)
				cacheType = await afterFeedPendding(task.feed.toString())
			}

			if (cacheType === feedMapTypes.updated) {
				//todo 
				console.log(`缓存命中: ${task.feed}`)
				const feed = await Feed.findById(task.feed).lean()
				taskUpdatedFeeds.push(feed)
				taskUpdatedFeedItems.push(feedUpdatedItemsCache[feed._id])
			} else if (!cacheType) {
				console.log(`set feedid ${task.feed} request pendding`)
				feedCacheMap[task.feed.toString()] = feedMapTypes.pendding
				// await mockPendding(2000)

				const feed = await Feed.findById(task.feed)
				const res = await handleCrawl(feed)
				const {updateTime, updateCount, fetchItems, feedItems, feedTitle, feedLink} = await handleFeedRes(feed, res, snapshot)

				const isUpdated = !!updateTime && (feed.fetchStatus !== FeedFetchStatus.new)  // 是否通知更新
				if (updateTime) {
					feed.lastUpdateCount = updateCount
					feed.lastUpdate = updateTime
					feed.lastSnapshot = snapshot
					feed.lastItems = fetchItems
				}

				feed.title = feedTitle,
				feed.link = feedLink
				feed.fetchStatus = feed.fetchStatus === FeedFetchStatus.new ? FeedFetchStatus.init : FeedFetchStatus.normal
				feed.lastFetch = Date.now()
				feed.nextFetch = Date.now() + (feed.updateInterval * 1000)
				// await feed.save()
				await Feed.updateOne({_id: feed._id}, feed)

				if (isUpdated) {
					taskUpdatedFeeds.push(feed)
					taskUpdatedFeedItems.push(feedItems)
				}
				feedUpdatedItemsCache[feed._id] = isUpdated ? feedItems : null
				feedCacheMap[feed._id] = isUpdated ? feedMapTypes.updated : feedMapTypes.notUpdated
				feedNextUpdateTimeCache[feed._id] = feed.nextFetch
			}

			task.nextFetch = feedNextUpdateTimeCache[task.feed]
			// await task.save()
			await UserFeed.updateOne({_id: task._id}, task)

		} catch (e) {
			console.log(`user feed ${task._id}/ ${task.user} /${task.fee} task error \n ------------- \n`)
			console.error(e)
			const key = task.feed.toString()
			if (feedCacheMap[key] === feedMapTypes.pendding) {
				feedCacheMap[key] = null
			}
		}
	}

	let users = [], skipCount = 0, isQueryDb = false
	const getUser = async (cursor) => {
		if (cursor >= userCount) {
			return null
		}
		if (isQueryDb) {
			return new Promise((resolve, reject) => {
				const func = () => {
					if (!isQueryDb) {
						return resolve(getUser(cursor))
					}
					setTimeout(func, 500)
				}
				func()
			})
		}
		if ((skipCount - 1) < cursor) {
			console.log(`query user from db, ${skipCount}~${skipCount + queryUserLimit}`)
			isQueryDb = true
			users = await User.find().sort({createAt: 1}).skip(skipCount).limit(queryUserLimit)
			skipCount += queryUserLimit
			isQueryDb = false
		}
		const radixCount = skipCount - queryUserLimit
		const realCursor = radixCount < 0 ? cursor : (cursor - radixCount)
		return users[realCursor]
	}

	const handleUserTasks = async () => {
		leftThreadCount --
		const nowCursor = ++cursor

		try {

			// console.log('user cursor:', nowCursor)
			const user = await getUser(nowCursor)
			if (!user) {
				leftThreadCount ++
				return
			}
			console.log(`update user's tasks: ${user.openId}/${user.name}`)
			// const tasks = await UserFeed.find({ user, nextFetch: { $lte: new Date() } })
			const tasks = await UserFeed.find({user})
			const taskUpdatedFeeds = [], taskUpdatedFeedItems = []
			console.log(`user task count: ${tasks.length}`)
			for (let task of tasks) {
				await handleUserFeedTask(task, taskUpdatedFeeds, taskUpdatedFeedItems)
			}

			if (taskUpdatedFeeds.length) {
				pushToUser(user, snapshot, taskUpdatedFeeds, taskUpdatedFeedItems)
			}
			console.log('push', taskUpdatedFeeds)
			resolvedUser ++
			leftThreadCount ++
		} catch (e) {
			console.log(`resolve user  error, cursor: ${nowCursor} `)
			leftThreadCount ++
		}		
	}

	for (let j =0; j < threadCount; j ++) {
		handleUserTasks()
	}

	const scheduleTasks = () => {
		return new Promise((resolve, reject) => {
			const func = () => {
				if (resolvedUser === userCount) {
					return resolve()
				}
				// if (leftThreadCount && (cursor < userCount) ) {
				// 	handleUserTasks()
				// }
				while (leftThreadCount && (cursor < userCount)) {
					handleUserTasks()
				}
				setTimeout(func, 500)
			}
			func()
		})
	}

	await scheduleTasks()
	console.log('end tasks')
	// todo api配合
	// const newlyUserFeedsKey = RedisKeys.newlyUserFeeds()
	// const newlyUserFeedTasks = await redis.get(newlyUserFeedsKey)
	// if (newlyUserFeedTasks) {
	// 	await redis.set(newlyUserFeedsKey, '')
	// 	const taskList = JSON.parse(newlyUserFeedTasks)
	// 	for (let task of taskList) {
	// 		await handleUserFeedTask(task)
	// 	}
	// }

	snapshot.feedCount = Object.keys(feedCacheMap).length
	snapshot.endTime = Date.now()
	await snapshot.save()

	console.log('end ----------------------' + new Date())
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
async function handleCrawl(feed) {
	console.log('req feed: ' + feed._id + '/ ' + feed.routePath)
	const { params = [] } = feed
	const p = params.reduce((obj, { key, value }) => {
		obj[key] = value
		return obj
	}, {})

	const ctx = getCtx({
		params: p,
		query: {},
	})

	// console.log(feed)
	const routePath = settings.routeBasePath + feed.routePath
	const handler = require(routePath)
	await handler(ctx)

	// console.log('req res')
	return ctx.state.data
}


/**
 * 
 * @param {Array} oldItems 
 * @param {Array} newItems 
 * @returns {boolean}
 */
function compareFeedItems(oldItems, newItems) {
	if (!oldItems.length) {
		return newItems
	}

	const getKey = ({ title = '', link = ''}) => title + link
	const map = oldItems.reduce((obj, item) => {
		obj[getKey(item)] = true
		return obj
	}, {})

	return newItems.filter(item => !map[getKey(item)])
}


const getFeedItemKey = (feedId, { title = '', link = ''}) => `${feedId}?${title.slice(0, 15)}&${link}`

/**
 * 
 * @param {Object} feed 
 * @param {Object} feedRes 
 * @param {Object} snapshot
 * @returns {Date}
 */
async function handleFeedRes(feed, feedRes, snapshot) {
	let time = null, updateCount = 0, createdFeedItems = []
	const {FeedOriginTypes, FeedFetchStatus} = Enums
	const notSaveDiffItems =  feed.fetchStatus ===  FeedFetchStatus.new
	const { item: newItems, title: feedTitle, link: feedLink } = feedRes
	console.log('handle resolve http res', newItems.length)

	newItems.forEach(item => {
		if (item.pubDate === 'Invalid Date') {
			item.pubDate = undefined
		}
	})
	if (newItems.length) {
		if (feed.originType === FeedOriginTypes.diff) {
			const oldItems = feed.lastItems || []
			const diffItems = compareFeedItems(oldItems, newItems)

			console.log('diff type feed: ', diffItems.length)
			if (diffItems.length) {
				time = Date.now()
				updateCount = diffItems.length
				if (!notSaveDiffItems) {
					const diffItemsRecords = diffItems.map((item, index) => {
						const obj = resolveResDescFeild(item.description)
						return new FeedItem({
							feed,
							snapshot,
							feedSnapshot: feed._id + snapshot._id,
							feedType: feed.type,
							signature: `${feed._id}?${Date.now()}&${index}`,
							...item,
							...obj
						})
					})
					createdFeedItems = await FeedItem.create(diffItemsRecords)
				}
				
			}

		} else {
			const i = newItems[0]
			let diffItems = []
			let isPrecise = 0

			if (i.pubDate && i.pubDate !== 'Invalid Date') {
				// todo 考虑数据重复
				const feedUpdateTime = new Date(feed.lastUpdate)
				newItems.sort((a, b) => {
					return (new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
				})
				newItems.every(item => {
					const t1 = new Date(item.pubDate)
					if (t1 > feedUpdateTime) {
						diffItems.push(item)
						return true
					}
					return false
				})
				console.log('increase type has pubDate',feedUpdateTime, diffItems.length)
				if (diffItems.length) {
					time = diffItems[0].pubDate
					updateCount = diffItems.length
					isPrecise = 1
				}
			} else {
				const oldItems = feed.lastItems || []
				diffItems = compareFeedItems(oldItems, newItems)
				console.log('increase type dont has pubDate: ',  diffItems.length)
				if (diffItems.length) {
					time = Date.now()
					updateCount = diffItems.length
				}
			}

			if (time && !notSaveDiffItems) {
				try {
					const feedItems = diffItems.map(item => {
						const obj = resolveResDescFeild(item.description)
						return new FeedItem({
							feed,
							snapshot,
							feedSnapshot: feed._id + snapshot._id,
							feedType: feed.type,
							pubDate: Date.now(),
							isPrecise,
							signature: getFeedItemKey(feed._id, item),
							...item,
							...obj,
						})
					})
					createdFeedItems = await FeedItem.create(feedItems)
				} catch (e) {
					console.log('save feed items error: ', e.message)
					// throw e
					time = null
					updateCount = 0
				}
			}
		}
	}
	return {
		updateTime: time,
		updateCount,
		fetchItems: newItems,
		feedItems: createdFeedItems,
		feedTitle,
		feedLink
	}
}

const containerId = 'balala-container-123'
const textLenghtLimit = 450
function resolveResDescFeild (htmlStr = '') {
	const $ = cherrio.load(`<div id="${containerId}">${htmlStr}</div>`)

	const htmlText = $(`#${containerId}`).text()
	const trimText = htmlText ?  htmlText.replace(/\s/g, '') : ''

	let contentType = Enums.FeedItemTypes.digest,
		desc = htmlText
	if (trimText.length > textLenghtLimit) {
		contentType = Enums.FeedItemTypes.long
		desc = trimText.slice(0, textLenghtLimit)
	}

	const imgs = []
	$('img').each(function (i) {
		if (i <= 2) {
			const src = $(this).attr('src')
			const newSrc = settings.baseUrl +  '/api/source/img?src=' + encodeURIComponent(src)
			// $(this).attr('src', newSrc)
			imgs.push(newSrc)
		}
	})

	return {
		contentType,
		imgs,
		desc,
	}
}

main()

module.exports = main