const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId


const UserSnapshotSchema = new mongoose.Schema({
	createAt: {type: Date, default: Date.now},
	updateAt: {type: Date, default: Date.now},
	pushTime: {type: Date, default: Date.now},
	user: {type: ObjectId, ref: 'User'},
	snapshot: {type: ObjectId, ref: 'Snapshot'},
	feeds: [{
		feed: {type: ObjectId, ref: 'Feed'},
		name: String, // 用户自定义的名字 userfeed相关
		icon: String, // feed icon
		lastUpdate: {type: Date, default: Date.now}, // 最近一次源更新
		lastFetch: {type: Date}, // 最近一次请求是否更新
		lastSnapshot: {type: ObjectId, ref: 'Snapshot'}, // 最近一次更新的快照
		lastUpdateCount: Number,
	}],
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