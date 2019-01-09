import APIS from '../service/index'
import {formatTime} from './util'
import {UserSnapshot} from '../propTypes'

const initState = {
    messageList: [],
    position: null
}

const transformMessageItem = (item: UserSnapshot) => {
    const {createAt, feeds} = item
    return {
        ...item,
        createAt: formatTime(createAt),
    }
}


export default {
    namespace: 'message',
    state: initState,
    effects: {
        * fetchMessageList ({payload: {params}}, {put, call}) {
            const res = yield call(APIS.getMessageList.bind(null, params))
            if (res && res.code === 0) {
                const {list, position} = res
                yield put({
                    type: 'saveData',
                    payload: {
                        position
                    }
                })
                yield put({
                    type: 'appendList',
                    payload: {
                        key: 'messageList',
                        list: list.map(transformMessageItem),
                    }
                })
            } else {
                // todo
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