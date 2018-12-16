const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId


const Snapshot = new mongoose.Schema({
    createAt: {type: Date, default: Date.now},
    updateAt: {type: Date, default: Date.now},
    startTime: {type: Date, default: Date.now},
    endTime: {type: Date},
    // userCount: {type: Number, default: 0}, // 快照关联的用户数
    feedCount: {type: Number, default: 0}, // 快照关联的feed数
})

Snapshot.pre('save', function(next) {
    this.updateAt = Date.now()
    next()
})

Snapshot.pre('update', function() {
    this.update({}, {$set: {updateAt: Date.now()}})
})

module.exports = mongoose.model('Snapshot', Snapshot)