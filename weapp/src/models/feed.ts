import APIS from '../service/index'
import {formatTime} from './util'
import {UserFeed, Feed, UserFeedItem} from '../propTypes'

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
        return null
    }
    const {name, feed, createAt} = userFeed
    feed.name = name || feed.originName
    feed.lastUpdate = formatTime(feed.lastUpdate)
    feed.subscribeTime = formatTime(createAt)
    return feed
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
                        list: list.map(transformUserFeedItem)
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