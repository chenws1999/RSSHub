
import APIS from '../service'
import {transformPushRecord, transformUserFeed} from './util'

const initState = {
    myFeedList: [],
    originList: [],
}

export default {
    namespace: 'home',
    state: initState,
    effects: {
        * fetchMyFeedList ({payload: {params}}, {put, call}) {
            const res = yield call(APIS.getMyFeedList.bind(null, params))
            const {list} = res
            yield put({
                type: 'saveData',
                payload: {
                    myFeedList: list.map(transformUserFeed)
                }
            })
        },
        * fetchFeedOriginList ({payload: {params}}, {put, call}) {
            const res = yield call(APIS.getFeedOriginList.bind(null, params))
            const {list} = res
            yield put({
                type: 'appendList',
                payload: {
                    key: 'originList',
                    list
                }
            })
        },
        * fetchFeedOriginItem ({payload: {params}}, {put, call}) {
            const res = yield call(APIS.getFeedOriginItem.bind(null, params))
            return res
        },
        * subscribeOrigin ({payload: {data}}, {put, call}) {
            const res = yield call(APIS.subscribeFeed.bind(null, data))
            return res
        },
        * unsubscribeOrigin ({payload: {data}}, {put, call}) {
            const res = yield call(APIS.unsubscribeFeed.bind(null, data))
            return res
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
    }
}   