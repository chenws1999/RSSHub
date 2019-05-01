import APIS from '../service/index'
import {formatTime} from './util'
import {UserFeedItem} from '../propTypes'

import Taro from '@tarojs/taro'

const initState = {
    feedItemList: [],
    position: null
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

export default {
    namespace: 'pushline',
    state: initState,
    effects: {
        * fetchUserFeedItemList ({payload: {params, refresh = false}}, {put, call}) {
            const res = yield call(APIS.getPushItemList.bind(null, params))
            if (res && res.code === 0) {
                const {list, position} = res
                yield put({
                    type: 'saveData',
                    payload: {
                        position,
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
            }
            
        },
        * collectUserFeedItem ({payload: {data, feedItemId}}, {put, call}) {
            const res = yield call(APIS.collectItem.bind(null, data))
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
        unshiftList (state, {payload}) {
            const {key, list} = payload
            const oldList = state[key]
            return {
                ...state,
                [key]: [...list, ...oldList]
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
            console.log('inner', feedItemList.length)
            feedItemList.some(item => {
                console.log(item._id, feedItemId)
                if (item._id === feedItemId) {
                    console.log('match', userCollectId)
                    item.userCollectId = userCollectId
                    return true
                }
            })
            console.log(feedItemList)
            return {
                ...state,
                feedItemList: [...feedItemList]
            }
        },
    }
}   