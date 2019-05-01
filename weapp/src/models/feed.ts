import APIS from '../service/index'
import {formatTime, getUserFeedStatus} from './util'
import {UserFeed, UserFeedItem, UserFeedStatus} from '../propTypes'
import Dialog from '../components/vant-weapp/dist/dialog/dialog'

import Taro from '@tarojs/taro'

const initState = {
    position: null,
    feedItemList: [],
    feedInfo: null
}

const transformUserFeedItem = (item: UserFeedItem) => {
    const {feedItem: {desc = ''}} = item
    const matched = desc.match(/\n/g)
    return {
        ...item,
        pubDate: formatTime(item.pubDate),
        descLineCount: matched ? matched.length + 1 : 1
    }
}

const getFeedInfoObj = (userFeed: UserFeed) => {
    if (!userFeed) {
        Dialog.alert({
            title: '无效访问',
            message: '您还没有订阅该源哦！',
            showCancelButton: false,
        }).then(res => {
            Taro.navigateBack()
        })
        return {
            name: '无',
            lastUpdate: '暂无',
            subscribeTime: '暂无'
        }
    }
    const status = getUserFeedStatus(userFeed)

    const {name, feed, createAt} = userFeed

    const lastUpdate = [UserFeedStatus.normal].includes(status) ? `${formatTime(feed.lastUpdate)}条` : '暂无'
    const lastUpdateCount = [UserFeedStatus.normal].includes(status) ? feed.lastUpdateCount : '暂无'
    
    return {
        ...feed,
        name: name || feed.originName,
        lastUpdate,
        lastUpdateCount,
        subscribeTime: formatTime(createAt),
    }
}

export default {
    namespace: 'feed',
    state: initState,
    effects: {
        * fetchFeedItemList ({payload: {params, refresh = false}}, {put, call}) {
            const res = yield call(APIS.getFeedContentItems.bind(null, params))
            const {list, position, userFeed} = res

            yield put({
                type: 'saveData',
                payload: {
                    position,
                    feedInfo: getFeedInfoObj(userFeed)
                }
            })

            if (refresh) {
                yield put({
                    type: 'saveData',
                    payload: {
                        feedItemList: list.map(transformUserFeedItem)
                    }
                })
                Taro.stopPullDownRefresh()
            } else {
                yield put({
                    type: 'appendList',
                    payload: {
                        key: 'feedItemList',
                        list: list.map(transformUserFeedItem),
                    }
                })
            }
            
        },
        * collectUserFeedItem ({payload: {data, feedItemId}}, {put, call}) {
            const res = yield call(APIS.collectItem.bind(null, data))
            console.log('res', res, res.item._id)
            if (res && res.code === 0) {
                yield put({
                    type: 'afterCollectAction',
                    payload: {
                        feedItemId,
                        userCollectId: res.item._id
                    }
                })
                return true
            } else {
                //todo fail 
            }
        },
        * deleteCollectUserFeedItem ({payload: {data, feedItemId}}, {put, call}) {
            const res = yield call(APIS.deleteCollectedItem.bind(null, data))
            console.log('res', res)
            if (res && res.code === 0) {
                yield put({
                    type: 'afterCollectAction',
                    payload: {
                        feedItemId,
                    }
                })
                return true
            } else {
                //todo fail 
            }
        }
    },
    reducers: {
        saveData (state, {payload}) {
            return {
                ...state,
                ...payload
            }
        },
        appendList (state,{payload}) {
            const {key, list} = payload
            const oldList = state[key]
            return {
                ...state,
                [key]: [...oldList, ...list]
            }
        },
        afterCollectAction (state, {payload}) {
            const {feedItemId, userCollectId = null} = payload
            const {feedItemList = []} = state
            feedItemList.some(item => {
                if (item._id === feedItemId) {
                    item.userCollectId = userCollectId
                    return true
                }
            })
            return {
                ...state,
                feedItemList: [...feedItemList]
            }
        },
    }
}   