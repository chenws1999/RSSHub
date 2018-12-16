const mongoose = require('mongoose')

const settings = require('../config/settings.js')
// Database
if (settings.mongouser) {
	mongoose.connect(settings.mongouri, {user: settings.mongouser, pass: settings.mongopass, useMongoClient:true, useNewUrlParser: true})
} else {
	mongoose.connect(settings.mongouri, { useNewUrlParser: true})
}
mongoose.connection.on('error', function () {
	console.error('MongoDB Connection Error. Please make sure MongoDB is running.')
})
