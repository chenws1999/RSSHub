const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId


const FeedOriginSchema = new mongoose.Schema({
	createAt: {type: Date, default: Date.now},
	updateAt: {type: Date, default: Date.now},
	code: {type: String, unique: true},
	name: {type: String},
	uniqueName: {type: String, unique: true},
	desc: String,
	feedType: {type: String},
	tags: [String],
})

FeedOriginSchema.pre('save', function(next) {
	this.updateAt = Date.now()
	next()
})

FeedOriginSchema.pre('update', function() {
	this.update({}, {$set: {updateAt: Date.now()}})
})

module.exports = mongoose.model('FeedOrigin', FeedOriginSchema)