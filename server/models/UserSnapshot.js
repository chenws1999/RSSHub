const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId


const UserSnapshotSchema = new mongoose.Schema({
	createAt: {type: Date, default: Date.now},
	updateAt: {type: Date, default: Date.now},
	pushTime: {type: Date, default: Date.now},
	user: {type: ObjectId, ref: 'User'},
	snapshot: {type: ObjectId, ref: 'Snapshot'},
	feeds: [Object],
	unread: {type: Number, default: 1} // 
})

UserSnapshotSchema.pre('save', function(next) {
	this.updateAt = Date.now()
	next()
})

UserSnapshotSchema.pre('update', function() {
	this.update({}, {$set: {updateAt: Date.now()}})
})

module.exports = mongoose.model('UserSnapshot', UserSnapshotSchema)