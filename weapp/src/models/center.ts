import APIS from '../service'

const initState = {
    _csrf: '',
}

export default {
    namespace: 'center',
    state: initState,
    effects: {
        * fetchMineInfo (_, {put, call}) {
        console.log('inner')
            const res = yield call(APIS.fetchMineInfo)
            if (res.code !== 0) {
                return
            }
            yield put({
                type: 'saveData',
                payload: {
                    _csrf: res._csrf,
                    profile: res.profile,
                    userOfMine: res.profile.user,
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
        }
    }
}   