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
apiRouter.get('/feed/precheck', catchError(mainCtrl.preCheckSubscribe))


apiRouter.use(mainCtrl.isLogin)
apiRouter.get('/user/myfeedList', catchError(mainCtrl.getMyFeedList))
apiRouter.get('/user/info', catchError(mainCtrl.getMineInfo))
apiRouter.get('/user/homeInfo', catchError(mainCtrl.getHomeInfo))
apiRouter.get('/user/overview', catchError(mainCtrl.getOverview))
apiRouter.get('/user/collect/list', catchError(mainCtrl.getMyCollectList))
apiRouter.post('/user/collect', catchError(mainCtrl.collectFeedItem))
apiRouter.post('/user/deleteCollect', catchError(mainCtrl.deleteCollectItem))


apiRouter.get('/feed/origin/item', catchError(mainCtrl.getFeedOriginItem))
apiRouter.post('/feed/subscribe', catchError(mainCtrl.subscribeFeed))
apiRouter.post('/feed/unsubscribe', catchError(mainCtrl.unsubscribeFeed))
apiRouter.get('/feed/items', catchError(mainCtrl.getFeedItemList))
apiRouter.get('/feed/origin/list', catchError(mainCtrl.getFeedOriginListV2))

apiRouter.get('/push/feedItems', catchError(mainCtrl.getPushFeedItemList))
apiRouter.get('/push/list', catchError(mainCtrl.getPushRecordList)) //消息通知
apiRouter.post('/push/read', catchError(mainCtrl.readPushRecord))
apiRouter.post('/push/formId', catchError(mainCtrl.recieveFormId))


const rootRouter = express.Router()

rootRouter.get('/api/source/img', catchError(mainCtrl.fetchCrosFile))
rootRouter.use('/api', apiRouter, mainCtrl.errHandler)


module.exports = rootRouter