import DateFormat from 'dateformat'

import APIS from '../service'


const initState = {
    _csrf: '',
    user: null,
    feedList: [],
    unreadCount: 0,
    unreadPush: null,
    pushList: [],
    hasMore: true,
    myFeedList: [],
    originList: [],
}

const transformPushRecord = obj => {
    obj.pushTimeStr = DateFormat(obj.pushTime, 'yyyy-mm-dd HH:MM')
    return obj
}

const transformUserFeed = obj => {
    obj.updateCount = obj.feed.lastUpdateCount,
    obj.undateTimeStr = DateFormat(obj.feed.lastUpdate, 'yyyy-mm-dd HH:MM')
    return obj
}

export default {
    namespace: 'center',
    state: initState,
    effects: {
        * fetchMineInfo (_, {put, call}) {
            console.log('inner')
            const res = yield call(APIS.getMineInfo)
            if (res.code !== 0) {
                return
            }
            yield put({
                type: 'saveData',
                payload: {
                    // _csrf: res._csrf,
                    // profile: res.profile,
                    user: res.uer,
                }
            })
        },
        * login ({payload: {data}}, {put, call}) {
            const res = yield call(APIS.login.bind(null, data))
            return res
        },
        * fetchOverview (_, {put, call}) {
            const res = yield call(APIS.getOverview)
            yield put({
                type: 'saveData',
                payload: {
                    unreadCount: res.unreadCount,
                    unreadPush:  res.unreadPush ? transformPushRecord(res.unreadPush) : null,
                    feedList: res.feedList.map(transformUserFeed)
                }
            })
        },
        * fetchPushList ({payload: {params}}, {put, call}) {
            const res = yield call(APIS.getPushList.bind(null, params))
            const {list} = res
            const hasMore = list.length !== 0
            yield put({
                type: 'saveData',
                payload: {
                    hasMore
                }
            })
            yield put({
                type: 'appendList',
                payload: {
                    key: 'pushList',
                    list: list.map(transformPushRecord)
                }
            })
        },
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