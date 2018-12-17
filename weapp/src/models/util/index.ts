import DateFormat from 'dateformat'

const transformPushRecord = obj => {
    obj.pushTimeStr = DateFormat(obj.pushTime, 'yyyy-mm-dd HH:MM')
    return obj
}

const transformUserFeed = obj => {
    obj.updateCount = obj.feed.lastUpdateCount,
    obj.undateTimeStr = DateFormat(obj.feed.lastUpdate, 'yyyy-mm-dd HH:MM')
    return obj
}


export {
    transformPushRecord,
    transformUserFeed
}