import request from './req'
import {stringify} from 'qs'

async function login (data) {
    return request('/loginweapp', {
        data,
        method: 'POST'
    })
} 

async function getMineInfo (params) {
    return request('/user/info?' + stringify(params) )
}

async function getMyFeedList (params) {
    return request('/user/myFeedList?' + stringify(params) )
}

async function getOverview (params = {}) {
    return request('/user/overview?' + stringify(params) )
}

async function getFeedOriginList (params) {
    return request('/feed/origin/list?' + stringify(params) )
}

async function getFeedOriginItem (params) {
    return request('/feed/origin/item?' + stringify(params) )
}


async function getFeedContents (params) {
    return request('/feed/contents?' + stringify(params) )
}


async function subscribeFeed (data) {
    return request('/feed/subscribe', {
        data,
        method: 'POST'
    })
}

async function unsubscribeFeed (data) {
    return request('/feed/unsubscribe', {
        data,
        method: 'POST'
    })
}

async function getPushList (params) {
    return request('/push/List?' + stringify(params) )
}


async function readPushRecord (data) {
    return request('/push/read?', {
        data,
        method: 'POST'
    })
}

async function postFormId (data) {
    return request('/push/formId?', {
        data,
        method: 'POST'
    })
}

export default {
    login,
    getMineInfo,
    getMyFeedList,
    getOverview,
    getFeedContents,
    getFeedOriginList,
    getFeedOriginItem,
    subscribeFeed,
    unsubscribeFeed,
    getPushList,
    readPushRecord,
    postFormId
}