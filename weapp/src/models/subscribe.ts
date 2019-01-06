import APIS from '../service/index'
import {formatTime} from './util'
import {UserFeed, Feed, UserFeedItem} from '../propTypes'

import Taro from '@tarojs/taro'

const initState = {
    position: null,
    feedOriginList: [],
    // action values:
    focusFeedOrigin: null,
    searchFeedInfo: null,
    isPreCheckValid: false
}


export default {
    namespace: 'subscribe',
    state: initState,
    effects: {
        * fetchFeedOriginList ({payload: {params, refresh = false}}, {put, call}) {
            const res = yield call(APIS.getFeedOriginList.bind(null, params))
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
                        feedOriginList: list
                    }
                })
                Taro.stopPullDownRefresh()
            } else {
                yield put({
                    type: 'appendList',
                    payload: {
                        key: 'feedOriginList',
                        list,
                    }
                })
            }
            
        },
        * subscribeFeed ({payload: {data, originItemId, isImmutable}}, {put, call}) {
            const res = yield call(APIS.subscribeFeed.bind(null, data))
            if (res && res.code === 0 && isImmutable) {
                yield put({
                    type: 'afterSubscibeAction',
                    payload: {
                        originItemId,
                        userFeedId: res.userFeed._id
                    }
                })
                return true
            } else {
                //todo fail 
            }
        },
        * unSubscribeFeed ({payload: {data, originItemId}}, {put, call}) {
            const res = yield call(APIS.unsubscribeFeed.bind(null, data))
            console.log('res', res)
            if (res && res.code === 0) {
                yield put({
                    type: 'afterSubscibeAction',
                    payload: {
                        originItemId,
                    }
                })
                return true
            } else {
                //todo fail 
            }
        },
        * fetchFeedOriginItem ({payload: {params}}, {put, call}) {
            const res = yield call(APIS.getFeedOriginItem.bind(null, params))

            if (res && res.code === 0) {
                const {feedOrigin} = res
                console.log(feedOrigin, 'focus')
                yield put({
                    type: 'saveData',
                    payload: {
                        focusFeedOrigin: feedOrigin
                    }
                })
            }  else {
                // todo
            }          
        },
        * preCheckSubscribeFeed ({payload: {params}}, {put, call}) {
            const res = yield call(APIS.preCheckSubscribeFeed.bind(null, params))
            if (res && res.code === 0) {
                yield put({
                    type: 'saveData',
                    payload: {
                        searchFeedInfo: res.info,
                        isPreCheckValid: true
                    }
                })
            } else {
                yield put({
                    type: 'saveData',
                    payload: {
                        searchFeedInfo: null,
                        isPreCheckValid: true
                    }
                })
                //todo fail 
            }
        },
        * subscribeFeedByParams ({payload: {data}}, {put, call}) {
            const res = yield call(APIS.subscribeFeed.bind(null, data))
            return res
        },
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
        afterSubscibeAction (state, {payload}) {
            const {originItemId, userFeedId = null} = payload
            const {feedOriginList = []} = state
            feedOriginList.some(item => {
                if (item._id === originItemId) {
                    item.userFeedId = userFeedId
                    return true
                }
            })
            return {
                ...state,
                feedOriginList: [...feedOriginList]
            }
        },
    }
}   