import APIS from '../service'
import {transformPushRecord, transformUserFeed} from './util'


const initState = {
    pushList: [],
    hasMore: true,
}

export default {
    namespace: 'pushList',
    state: initState,
    effects: {
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