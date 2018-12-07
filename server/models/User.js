const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId


const User = new mongoose.Schema({
    createAt: {type: Date, default: Date.now},
    updateAt: {type: Date, default: Date.now},
    openId: {type: String, unique: true},
    name: String,
    lastLogin: String,
    
})

User.pre('save', function(next) {
    this.updateAt = Date.now()
    next()
})

User.pre('update', function() {
    this.update({}, {$set: {updateAt: Date.now()}})
})

module.exports = mongoose.model('User', User)