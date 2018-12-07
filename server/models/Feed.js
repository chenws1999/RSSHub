const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId


const FeedSchema = new mongoose.Schema({
	createAt: {type: Date, default: Date.now},
	updateAt: {type: Date, default: Date.now},
	origin: {type: ObjectId, ref: 'FeedOrigin'},
	originCode: {type: String},
	lastUpdate: {type: Date}, // 最近一次源更新
	lastItemLink: {type: Date}, //最新的itemlink
	lastFetch: {type: Date}, // 最近一次请求是否更新
	lastSnapshot: {type: ObjectId, ref: 'Snapshot'}, // 最近一次更新的快照
})

FeedSchema.pre('save', function(next) {
	this.updateAt = Date.now()
	next()
})

FeedSchema.pre('update', function() {
	this.update({}, {$set: {updateAt: Date.now()}})
})

module.exports = mongoose.model('Feed', FeedSchema)