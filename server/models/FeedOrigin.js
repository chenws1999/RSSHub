const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId


const FeedOriginSchema = new mongoose.Schema({
	createAt: { type: Date, default: Date.now },
	updateAt: { type: Date, default: Date.now },
	parent: { type: ObjectId, ref: 'FeedOrigin' },
	code: { type: String, unique: true },
	name: { type: String },
	// uniqueName: {type: String, unique: true},
	desc: String,
	type: { type: String },
	priority: String,
	tags: [String],
	stop: { type: Number, default: 0 }, // 关闭源

	params: [{
		paramType: String, // 参数输入类型 (input, select)
		name: String,
		key: {type: String, unique: true},
		range: [{
			label: String,
			value: String,
			children: [{
				label: String,
				value: String
			}]
		}]
	}],
	routePath: String,
	updateInterval: {type: Number, default: 3600},
})

FeedOriginSchema.pre('save', function (next) {
	this.updateAt = Date.now()
	next()
})

FeedOriginSchema.pre('update', function () {
	this.update({}, { $set: { updateAt: Date.now() } })
})

module.exports = mongoose.model('FeedOrigin', FeedOriginSchema)