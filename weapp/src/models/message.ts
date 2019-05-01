import APIS from '../service/index'
import {formatTime} from './util'
import {UserSnapshot} from '../propTypes'

import Taro from '@tarojs/taro'

const initState = {
    messageList: [],
    position: null,
    isRefreshListLoading: false,
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
        * fetchMessageList ({payload: {params, refresh = false}}, {put, call}) {
            const res = yield call(APIS.getMessageList.bind(null, params))
            yield put({
                type: 'saveData',
                payload: {
                    isRefreshListLoading: refresh
                }
            })
            if (res && res.code === 0) {
                const {list, position} = res
                yield put({
                    type: 'saveData',
                    payload: {
                        position
                    }
                })
                if (refresh) {
                    yield put({
                        type: 'saveData',
                        payload: {
                            messageList: list.map(transformMessageItem)
                        }
                    })
                    Taro.stopPullDownRefresh()
                } else {
                    yield put({
                        type: 'appendList',
                        payload: {
                            key: 'messageList',
                            list: list.map(transformMessageItem),
                        }
                    })
                }
               
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