import APIS from '../service/index'
import {User} from '../propTypes'

// import dayjs from 'dayjs'
import {formatTime} from './util/index'

const initState = {
    homeUserInfo: null,
    lastMessageTime: null 
}

const transformUser = (user: User) => {
    const {collectCount, subscribeCount} = user
    const joinDays = Math.floor(( Date.now() -Date.parse(user.createAt) ) / (3600 * 24 * 1000))
    return {
        ...user,
        joinDays: joinDays,
    }
}

export default {
    namespace: 'home',
    state: initState,
    effects: {
        * fetchHomeUserInfo ({payload: {params}}, {put, call}) {
            const res = yield call(APIS.getHomeInfo.bind(null))
            if (res && res.code === 0) {
                return transformUser(res.user)
                // const {user, lastMessageTime} = res
                // yield put({
                //     type: 'saveData',
                //     payload: {
                //         homeUserInfo: transformUser(user),
                //         lastMessageTime: lastMessageTime && formatTime(lastMessageTime)
                //     }
                // })
                // return true
            }
           
        }
    },
    reducers: {
        saveData (state, {payload}) {
            console.log('save home', payload)
            return {
                ...state,
                ...payload
            }
        },
    }
}   