const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId


const UserFeedItemSchema = new mongoose.Schema({
	createAt: {type: Date, default: Date.now},
	updateAt: {type: Date, default: Date.now},
	user: {type: ObjectId, ref: 'User', required: true},
	feed: {type: ObjectId, ref: 'Feed', required: true},
	feedItem: {type: ObjectId, ref: 'FeedItem', required: true},
	pubDate: {type: Date, index: -1, required: true},
	unique: {type: String, unique: true, required: true}, // user + feeditem
	snapshot: {type: ObjectId, ref: 'Snapshot', required: true},
	feedOriginType: String,
	feedIcon: String, //头像地址
	feedName: String,
	userCollectId: {type: ObjectId, ref: 'UserCollect'},
})

UserFeedItemSchema.pre('save', function(next) {
	this.updateAt = Date.now()
	next()
})

UserFeedItemSchema.pre('updateMany', function() {
	this.update({}, {$set: {updateAt: Date.now()}})
})

module.exports = mongoose.model('UserFeedItem', UserFeedItemSchema)