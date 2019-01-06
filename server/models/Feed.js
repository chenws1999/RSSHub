const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId


const FeedSchema = new mongoose.Schema({
	createAt: {type: Date, default: Date.now},
	updateAt: {type: Date, default: Date.now},
	origin: {type: ObjectId, ref: 'FeedOrigin', required: true},
	originCode: {type: String, required: true},
	originType: {type: String, required: true},
	originName: {type: String}, //默认名称
	nextFetch: {type: Date, default: Date.now},
	fetchStatus: {type: String, required: true}, // 拉取的状态

	lastUpdate: {type: Date, default: Date.now}, // 最近一次源更新
	lastFetch: {type: Date}, // 最近一次请求是否更新
	lastSnapshot: {type: ObjectId, ref: 'Snapshot'}, // 最近一次更新的快照
	lastUpdateCount: Number,
	lastItems: [{
		title: String,
		link: String,
		author: String,
		pubDate: {type: Date},
	}],

	stop: {type: Number, default: 0}, // 关闭源
	subscribedCount: {type: Number, default: 0}, // 被订阅的数量
	icon: String, // 头像
	title: String,
	link: String,
	params: [{
		name: String,
		key: {type: String, required: true},
		value: {type: String, required: true}
	}],
	signatureStr: {type: String, unique: true, required: true},
	routePath: String, //存放代码文件的路径
	updateInterval: {type: Number, default: 3600}, // 更新时间间隔 单位 秒

})
 
FeedSchema.pre('save', function(next) {
	this.updateAt = Date.now()
	next()
})

FeedSchema.pre('update', function() {
	this.update({}, {$set: {updateAt: Date.now()}})
})

module.exports = mongoose.model('Feed', FeedSchema)