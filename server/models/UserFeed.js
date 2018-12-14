const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId


const UserFeedSchema = new mongoose.Schema({
	createAt: {type: Date, default: Date.now},
	updateAt: {type: Date, default: Date.now},
	userfeed: {type: String, unique: true},
	user: {type: ObjectId, ref: 'User'},
	feed: {type: ObjectId, ref: 'Feed'},
	originCode: String,
	name: String,
})

UserFeedSchema.pre('save', function(next) {
	this.updateAt = Date.now()
	next()
})

UserFeedSchema.pre('update', function() {
	this.update({}, {$set: {updateAt: Date.now()}})
})

module.exports = mongoose.model('UserFeed', UserFeedSchema)