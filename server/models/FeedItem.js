const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId


const FeedItemSchema = new mongoose.Schema({
	createAt: {type: Date, default: Date.now},
	updateAt: {type: Date, default: Date.now},
	snapshot: {type: ObjectId, ref: 'Snapshot', required: true},
	feedSnapshot: {type: String, unique: true},
	feed: {type: Object, ref: 'Feed', required: true},
	feedType: String,
	title: String,
	link: String,
	desc: String,
	author: String,
	pubDate: {type: Date},
	items: [{
		title: String,
		link: String,
		desc: String,
		author: String,
		pubDate: {type: Date},
	}]
})

FeedItemSchema.pre('save', function(next) {
	this.updateAt = Date.now()
	next()
})

FeedItemSchema.pre('update', function() {
	this.update({}, {$set: {updateAt: Date.now()}})
})

module.exports = mongoose.model('FeedItem', FeedItemSchema)