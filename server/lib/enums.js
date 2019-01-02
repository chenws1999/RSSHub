
module.exports = {
	FeedTags: {
		social: '1001',
		Programme: '1002',
		live: '1003',
		shoping: '1004',
	},
	RedisKeys: {
		subscribeCount: uid => `usersubscribeCount:${uid}`,
		isExcuteSnapshot: _ => 'excutesnapshot',
		freshFeedList: _ => 'freshfeedlist',
		emailCode: email => `emailcode:${email}`,
		accessToken: _ => 'weappaccesstoken',
		userFormIds: uid => `templateformids:${uid}`,
		newlyUserFeeds: _ => 'newlyUserFeeds',
		userCollections: uid => `usercollections:${uid}`
	},
	FeedOriginTypes: {
		diff: 'diff',
		increase: 'increase'
	},
	FeedOriginPriorityTypes: {
		main: 'main',
		second: 'second'
	},
	FeedOriginParamTypes: {
		input: 'input',
		select: 'select',
		multiSelect: 'multiSelect',
	},
	FeedFetchStatus: {
		new: 'new', // 新建 尚未进行初始化拉取
		init: 'init', // 进行了初始化拉取
		normal: 'normal', // 正常
	},
	FeedItemTypes: {
		digest: 1, //简短
		long: 2 // 长篇
	}
}