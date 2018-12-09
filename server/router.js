const express = require('express')

const mainCtrl = require('./controllers/main')

const apiRouter = express.Router()

apiRouter.post('/csrfToken', mainCtrl.getCsrfToken)
apiRouter.post('/loginweapp', mainCtrl.login)

apiRouter.use(mainCtrl.isLogin)
apiRouter.get('/user/myfeedList', mainCtrl.getMyFeedList)
apiRouter.get('/user/info', mainCtrl.getMineInfo)

apiRouter.get('/feed/originList', mainCtrl.getFeedOriginList)
apiRouter.post('/feed/subscribe', mainCtrl.subscribeFeed)
apiRouter.post('/feed/unsubcribe', mainCtrl.unsubscribeFeed)
apiRouter.get('/feed/contents', mainCtrl.getFeedContentList)

apiRouter.get('/push/List', mainCtrl.getPushRecordList)
apiRouter.post('/push/read', mainCtrl.readPushRecord)

const rootRouter = express.Router()
rootRouter.use('/api', apiRouter, mainCtrl.errHandler)
module.exports = rootRouter