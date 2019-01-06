const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId


const UserCollect = new mongoose.Schema({
	createAt: {type: Date, default: Date.now},
	updateAt: {type: Date, default: Date.now},
	user: {type: ObjectId, unique: true},
	feedItem: {type: ObjectId, ref: 'FeedItem'},
	userFeedItem: {type: ObjectId, ref: 'UserFeedItem'},
	uniqueKey: {type: String, unique: true}
})

UserCollect.pre('save', function(next) {
	this.updateAt = Date.now()
	next()
})

UserCollect.pre('update', function() {
	this.update({}, {$set: {updateAt: Date.now()}})
})

module.exports = mongoose.model('UserCollect', UserCollect)