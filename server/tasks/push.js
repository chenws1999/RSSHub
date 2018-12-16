const request = require('request-promise-native')

const User = require('../models/User')
const Feed = require('../models/Feed')
const UserFeed = require('../models/UserFeed')
const Snapshot = require('../models/Snapshot')
const FeedItem = require('../models/FeedItem')
const UserSnapshot = require('../models/UserSnapshot')

const {sendTemplate} = require('../lib/wechat')
const settings = require('../config/settings')

async function main (user, snapshot, feedList) {
	const idList = feedList.map(feed => feed._id)
	const validUserFeeds = await UserFeed.find({user, feed: {$in: idList}})
	const validFeedIds = validUserFeeds.map(userFeed => userFeed.feed)
	const validFeeds = feedList.filter(feed => validFeedIds.includes(feed._id))
	
	if (validFeedIds.length) {
		const userSnapshot = new UserSnapshot({
			user,
			snapshot,
			userSnapshot: user._id + snapshot._id,
			feeds: [validFeeds],
		})
		await userSnapshot.save()
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