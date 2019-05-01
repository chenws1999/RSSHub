import APIS from '../service/index'
import {transformPushRecord, transformUserFeed} from './util'


const initState = {
    _csrf: '',
    user: null,
    isCheckIn: false,
    showCheckInModal: false,
    feedList: [],
    unreadPushCount: 0,
    newlyPushRecord: null,
}

export default {
    namespace: 'center',
    state: initState,
    effects: {
        * fetchMineInfo (_, {put, call}) {
            const res = yield call(APIS.getBaseInfo)
            if (res.code !== 0) {
                return
            }
            yield put({
                type: 'saveData',
                payload: {
                    isCheckIn: res.isCheckIn,
                    showCheckInModal: !res.isCheckIn,
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
        * checkIn ({payload: {data}}, {put, call}) {
            console.log('inner checkin')
            const res = yield call(APIS.checkIn.bind(null, data))
            if (res && res.code === 0) {
                yield put({
                    type: 'saveData',
                    payload: {
                        isCheckIn: true,
                        showCheckInModal: false,
                    }
                })
            }
            yield put({
                type: 'saveData',
                payload: {
                    showCheckInModal: false,
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
    }
}   