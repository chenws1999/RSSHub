import APIS from '../service/index'
import { formatTime } from './util'
import { UserFeed, UserFeedStatus, FeedFetchStatus } from '../propTypes'

import Taro from '@tarojs/taro'

const initState = {
    userFeedList: [],
    isRefreshList: false,
}

const UserFeedStatusToLabel = {
    [UserFeedStatus.init]: '订阅初始化中',
    [UserFeedStatus.initFailed]: '订阅失败',
    [UserFeedStatus.success]: '订阅成功',
    [UserFeedStatus.normal]: '正常',
    [UserFeedStatus.stop]: '已暂停'
}

const tranformUserFeedObj = (item: UserFeed) => {
    const { feed } = item
    let status = UserFeedStatus.normal
    if (item.stop) {
        status = UserFeedStatus.stop
    } else if (feed.fetchStatus === FeedFetchStatus.new) {
        status = UserFeedStatus.init
    } else if (feed.fetchStatus === FeedFetchStatus.initFailed) {
        status = UserFeedStatus.initFailed
    } else if (feed.fetchStatus === FeedFetchStatus.init) {
        status = UserFeedStatus.success
    } else if (feed.fetchStatus === FeedFetchStatus.normal) {
        status = UserFeedStatus.normal
    }

    const lastUpdate = [UserFeedStatus.success, UserFeedStatus.normal].includes(status) ? formatTime(feed.lastUpdate) : '暂无'
    const lastUpdateCount = [UserFeedStatus.success, UserFeedStatus.normal].includes(status) ? feed.lastUpdateCount : '暂无'
    return {
        ...item,
        createAt: formatTime(item.createAt),
        lastUpdate,
        lastUpdateCount:  lastUpdateCount || 0,
        status,
        statusLabel: UserFeedStatusToLabel[status],
        feedIcon: feed.icon,
    }
}

export default {
    namespace: 'myFeed',
    state: initState,
    effects: {
        * fetchMyFeedList({ payload: { params, refresh = false } }, { put, call }) {
            yield put({
                type: 'saveData',
                payload: {
                    isRefreshList: refresh,
                }
            })
            const res = yield call(APIS.getMyFeedList.bind(null, params))
            if (res && res.code === 0) {
                const { list } = res
                yield put({
                    type: 'saveData',
                    payload: {
                        userFeedList: list.map(tranformUserFeedObj)
                    }
                })
            } else {
                // todo
            }
        },
        * unSubscribeFeed({ payload: { data, userFeedId } }, { put, call }) {
            const res = yield call(APIS.unsubscribeFeed.bind(null, data))
            if (res && res.code === 0) {
                yield put({
                    type: 'afterUnSubscribeFeed',
                    payload: {
                        userFeedId,
                    }
                })
                return true
            } else {
                //todo fail 
            }
        }
    },
    reducers: {
        saveData(state, { payload }) {
            return {
                ...state,
                ...payload
            }
        },
        appendList(state, { payload }) {
            const { key, list } = payload
            const oldList = state[key]
            return {
                ...state,
                [key]: [...oldList, ...list]
            }
        },
        afterUnSubscribeFeed(state, { payload }) {
            const { userFeedId } = payload
            let { userFeedList = [] } = state
            const index = userFeedList.findIndex(item => {
                return item._id === userFeedId
            })
            if (index > -1) {
                userFeedList.splice(index, 1)
            }
            return {
                ...state,
                userFeedList: [...userFeedList]
            }
        },
    }
}   