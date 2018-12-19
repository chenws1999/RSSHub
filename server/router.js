const express = require('express')

const mainCtrl = require('./controllers/main')

const catchError = (func) => {
	return async (req, res, next) => {
		try {
			await func(req, res, next)
		} catch (e) {
			console.log(e)
			res.json({
				code: -1,
				msg: e.message || '未知错误'
			})
		}
	}
}

const apiRouter = express.Router()
apiRouter.get('/csrfToken', catchError(mainCtrl.getCsrfToken))
apiRouter.post('/loginweapp', catchError(mainCtrl.login))

apiRouter.use(mainCtrl.isLogin)
apiRouter.get('/user/myfeedList', catchError(mainCtrl.getMyFeedList))
apiRouter.get('/user/info', catchError(mainCtrl.getMineInfo))
apiRouter.get('/user/overview', catchError(mainCtrl.getOverview))

apiRouter.get('/feed/origin/item', catchError(mainCtrl.getFeedOriginItem))
apiRouter.get('/feed/origin/list', catchError(mainCtrl.getFeedOriginList))
apiRouter.post('/feed/subscribe', catchError(mainCtrl.subscribeFeed))
apiRouter.post('/feed/unsubscribe', catchError(mainCtrl.unsubscribeFeed))
apiRouter.get('/feed/contents', catchError(mainCtrl.getFeedContentList))

apiRouter.get('/push/List', catchError(mainCtrl.getPushRecordList))
apiRouter.post('/push/read', catchError(mainCtrl.readPushRecord))
apiRouter.post('/push/formId', catchError(mainCtrl.recieveFormId))
const rootRouter = express.Router()
rootRouter.use('/api', apiRouter, mainCtrl.errHandler)
module.exports = rootRouter