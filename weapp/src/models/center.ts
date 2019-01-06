import APIS from '../service/index'
import {transformPushRecord, transformUserFeed} from './util'


const initState = {
    _csrf: '',
    user: null,
    feedList: [],
    unreadPushCount: 0,
    newlyPushRecord: null,
}

export default {
    namespace: 'center',
    state: initState,
    effects: {
        * fetchMineInfo (_, {put, call}) {
            const res = yield call(APIS.getMineInfo)
            if (res.code !== 0) {
                return
            }
            yield put({
                type: 'saveData',
                payload: {
                    // _csrf: res._csrf,
                    // profile: res.profile,
                    user: res.user,
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
                    unreadPushCount: res.unreadCount,
                    newlyPushRecord:  res.newlyPushRecord ? transformPushRecord(res.newlyPushRecord) : null,
                    feedList: res.feedList.map(transformUserFeed)
                }
            })
        },
        * readAllPushRecord (_, {put, call}) {
            const res = yield call(APIS.readPushRecord)
            
            if (res.code === 0) {
                yield put({
                    type: 'saveData',
                    payload: {
                        unreadPushCount: 0
                    }
                })
            }
        },
       
    },
    reducers: {
        saveData (state, {payload}) {
            return {
                ...state,
                ...payload
            }
        },
    }
}   