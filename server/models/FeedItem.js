const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId


const FeedItemSchema = new mongoose.Schema({
	createAt: {type: Date, default: Date.now},
	updateAt: {type: Date, default: Date.now},
	snapshot: {type: ObjectId, ref: 'Snapshot', required: true},
	// feedSnapshot: {type: String, unique: true},
	signature: {type: String, unique: true},
	feed: {type: ObjectId, ref: 'Feed', required: true},
	feedType: String,
	collectedCount: {type: Number, default: 0}, //被收藏数量 
	refCount: {type: Number, default: 0}, // 被userfeedItem引用的次数

	title: String,
	link: String,
	author: String,
	pubDate: {type: Date},
	isPrecise: {type: Number, default: 0}, // 是否是精确的更新时间
	imgs: [String],
	desc: String,
	contentType: Number, // 1, 2
})

FeedItemSchema.pre('save', function(next) {
	this.updateAt = Date.now()
	next()
})

FeedItemSchema.pre('updateMany', function() {
	this.update({}, {$set: {updateAt: Date.now()}})
})

module.exports = mongoose.model('FeedItem', FeedItemSchema)