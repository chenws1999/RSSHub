const mongoose = require('mongoose')

const User = require('../models/User')
const FeedOrigin = require('../models/FeedOrigin')
const Feed = require('../models/Feed')
const UserFeed = require('../models/UserFeed')
const Snapshot = require('../models/Snapshot')
const FeedItem = require('../models/FeedItem')

const settings = require('../config/settings.js')
const Enums = require('../lib/enums')

mongoose.connect('mongodb://localhost/jike')

const handler = require('../tasks/crawl')
async function main () {
	const user = new User({
		openId: '12445655',
		name: 'test',
	})
	await user.save()

	const feedOrigin = new FeedOrigin({
		code: 'bitest1',
		name: 'bitest',
		type: Enums.FeedOriginTypes.increase,
		desc: 'test',
	})

	await feedOrigin.save()
	
	const feed = new Feed({
		origin: feedOrigin,
		originCode: feedOrigin.code,
		originType: feedOrigin.type,
		lastUpdate: Date.now(),
		lastFetch: Date.now(),

		params: [{
			key: 'uid',
			value: '2267573'
		}]
	})

	await feed.save()

	const userfeed = new UserFeed({
		user,
		feed,
		userfeed: user._id + feed._id,
	})

	await userfeed.save()

	await handler()
}

// main()

handler()

async function main2 () {
	const user = await User.findOne({name: 'test'})

	const feedOrigin = new FeedOrigin({
		code: 'zhihuhot',
		name: 'zhihuhot',
		type: Enums.FeedOriginTypes.diff,
		desc: 'zhihuhot',
	})

	await feedOrigin.save()
	
	const feed = new Feed({
		origin: feedOrigin,
		originCode: feedOrigin.code,
		originType: feedOrigin.type,
		lastUpdate: Date.now(),
		lastFetch: Date.now(),
	})

	await feed.save()

	const userfeed = new UserFeed({
		user,
		feed,
		userfeed: user._id + feed._id,
	})

	await userfeed.save()

	await handler()
}

// main2()