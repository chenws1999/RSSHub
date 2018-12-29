'use strict';
const express      = require('express')
const compress     = require('compression')
const bodyParser   = require('body-parser')
const mongoose  = require('mongoose')
const csrf         = require('lusca').csrf()
const passport     = require('passport')
const session      = require('express-session')
const Redis      = require('ioredis')
const RedisStore = require('connect-redis')(session)
const settings   = require('./config/settings')
const http = require('http')
const logger = require('morgan')

require('./lib/passport')


function onListening() {
	let addr = server.address()
	let bind = typeof addr === 'string'
		? 'pipe ' + addr
		: 'port ' + addr.port
	console.log('Listening on ' + bind)
}


const app = express()

// Database
if (settings.mongouser) {
	mongoose.connect(settings.mongouri, {user: settings.mongouser, pass: settings.mongopass, useNewUrlParser: true})
} else {
	mongoose.connect(settings.mongouri, {useMongoClient:true, useNewUrlParser: true})
}
mongoose.connection.on('error', function (e) {
	console.log(e)
	console.error('MongoDB Connection Error. Please make sure MongoDB is running.')
})

const redisClient = new Redis({})

const redisStore = new RedisStore({
	client:         redisClient,
	ttl: 60*24*60*30, // expire time in seconds
	auto_reconnect: true
})

app.use(compress())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true,limit:'30mb',parameterLimit: 30000}))


const sessionSet = {
	name:              'balalala.sid',
	resave:            true,
	saveUninitialized: true,
	secret:            settings.sessionSecret,
	store:             redisStore
}

app.use(session(sessionSet))



// app.use(function (req, res, next) {
// 	// CSRF protection.
// 	csrf(req, res, next)
// })
app.use(passport.initialize())
app.use(passport.session())


app.use(function (req, res, next) {
	res.locals.user = req.user
	next()
})

app.use(logger('dev'))
// // serve静态文件
// app.use(rootname + '/werecruit/static', express.static(
// 	path.join(__dirname, '../recruitdist'),
// 	{maxAge: '10d'}
// ))

// app.use(errorHandler())
//routes
const router = require('./router.js')
app.use('/', router)
/**
 * Get port from environment and store in Express.
 */
app.set('port', settings.port)

/**
 * Create HTTP server.
 */
const server = http.createServer(app)

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(settings.port)
// server.on('error', onError)
server.on('listening', onListening)


