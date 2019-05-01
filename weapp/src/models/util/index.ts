import DateFormat from 'dateformat'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'
import {UserFeedStatus, UserFeed, FeedFetchStatus} from '../../propTypes'

dayjs.locale('zh-cn')
dayjs.extend(relativeTime)

const transformPushRecord = obj => {
    obj.pushTimeStr = DateFormat(obj.pushTime, 'yyyy-mm-dd HH:MM')
    return obj
}

const transformUserFeed = obj => {
    obj.updateCount = obj.feed.lastUpdateCount,
    obj.undateTimeStr = DateFormat(obj.feed.lastUpdate, 'yyyy-mm-dd HH:MM')
    return obj
}

const formatTime = (time: String) => {
    console.log('innerr format')
    const nowTime = dayjs()
    const timeBoundary = dayjs().subtract(1, 'hour')
    const timeObj = dayjs(time)
    if (nowTime.year() !== timeObj.year()) {
        return timeObj.format('YYYY-MM-DD HH:mm')
    } else if (nowTime.month() !== timeObj.month()) {
        return timeObj.format('MM-DD HH:mm')
    } else if (nowTime.date() !== timeObj.date()) {
        return timeObj.format('MM-DD HH:mm')
    } else if (timeObj.isBefore(timeBoundary)) {
        return timeObj.format('HH:mm')
    } else {
        return timeObj.fromNow()
    }
}

const getUserFeedStatus = (item: UserFeed) => {
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
    return status
}

export {
    transformPushRecord,
    transformUserFeed,
    formatTime,
    getUserFeedStatus
}