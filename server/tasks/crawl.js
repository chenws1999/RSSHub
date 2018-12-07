const User = require('../models/User')
const Feed = require('../models/Feed')
const UserFeed = require('../models/UserFeed')
const Snapshot = require('../models/Snapshot')

const settings = require('../config/settings.js')
const Enums = require('../lib/enums')
const redis = require('../lib/redis')

const FeedOriginCodeToFunc = {
	'fanju': require('../../routes/bilibili/bangumi'),
	'bi1001': require('../../routes/bilibili/article')
}
async function main() {
	const taskCount = await UserFeed.count()
	const startTime = new Date()
	const snapshot = new Snapshot({
		startTime,
	})
	await snapshot.save()

	const allUpatedFeedsMap = {}

	const userCount = await User.count()
	let feedCount = 0
	const interval = 100
	for (let i = 0; i < userCount; i++) {
		const users = await User.find().skip(i * interval).limit(interval)
		for (let user of users) {
			const tasks = UserFeed.find({ user })
			const taskUpdatedFeeds = []
			for (let task of tasks) {
				const taskFunc = FeedOriginCodeToFunc[task.originCode]
				const res = await taskFunc()
				const { item } = res
				if (allUpatedFeedsMap[task.origin]) {
					 //todo 
					const feed = await Feed.findById(task.origin).lean()
					taskUpdatedFeeds.push(feed)
				} else {
					const feed = await Feed.findById(task.origin)
					feed.lastUpdate = Date.now()
					feed.lastFetch = Date.now()
					feed.lastSnapshot = snapshot
				}
			}
		}
	}
}

function cr() {

}


module.exports = main