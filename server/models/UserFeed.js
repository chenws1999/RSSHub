const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId


const UserFeedSchema = new mongoose.Schema({
	createAt: {type: Date, default: Date.now},
	updateAt: {type: Date, default: Date.now},
	userfeed: {type: String, unique: true, required: true},
	user: {type: ObjectId, ref: 'User', required: true},
	feed: {type: ObjectId, ref: 'Feed', required: true},
	feedOrigin: {type: ObjectId, ref: 'FeedOrigin'},
	originCode: {type: String, required: true},
	name: String,
	stop: {type: Number, default: 0},
	nextFetch: {type: Date, required: true}, //下次更新时间
})

UserFeedSchema.pre('save', function(next) {
	this.updateAt = Date.now()
	next()
})

UserFeedSchema.pre('update', function() {
	this.update({}, {$set: {updateAt: Date.now()}})
})

module.exports = mongoose.model('UserFeed', UserFeedSchema)