import APIS from '../service/index'
import {formatTime} from './util'
import {UserFeed, Feed, MyCollect} from '../propTypes'

import Taro from '@tarojs/taro'

const initState = {
    position: null,
    feedItemList: [],
    isRefreshList: false
}

const transformCollectItem = (item: MyCollect) => {
    const {feedItemId: {desc = '', pubDate}} = item
    const matched = desc.match(/\n/g)
    return {
        ...item,
        pubDate: formatTime(pubDate),
        descLineCount: matched ? matched.length + 1 : 1
    }
}


export default {
    namespace: 'myCollect',
    state: initState,
    effects: {
        * fetchFeedItemList ({payload: {params, refresh = false}}, {put, call}) {
            yield put({
                type: 'saveData',
                payload: {
                    isRefreshList: refresh
                }
            })

            const res = yield call(APIS.getMyCollectList.bind(null, params))
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
                        list: list.map(transformCollectItem)
                    }
                })
                Taro.stopPullDownRefresh()
            } else {
                yield put({
                    type: 'appendList',
                    payload: {
                        key: 'feedItemList',
                        list: list.map(transformCollectItem),
                    }
                })
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
            const findIndex = feedItemList.findIndex(item => {
                return item._id === feedItemId
            })
            if (findIndex) {
                feedItemList.splice(findIndex, 1)
            }
            return {
                ...state,
                feedItemList: [...feedItemList]
            }
        },
    }
}   