import request from './req'
import {stringify} from 'qs'

export async function getFeedOriginList (params) {
    return request('/feed/origin/list?' + stringify(params) )
}

export async function getFeedOriginItem (params) {
    return request('/feed/origin/item?' + stringify(params) )
}


export async function getFeedContentItems (params) {
    return request('/feed/items?' + stringify(params) )
}

export async function preCheckSubscribeFeed (params) {
    return request('/feed/precheck?' + stringify(params),)
}

export async function subscribeFeed (data) {
    return request('/feed/subscribe', {
        data,
        method: 'POST'
    })
}

export async function unsubscribeFeed (data) {
    return request('/feed/unsubscribe', {
        data,
        method: 'POST'
    })
}

export async function getPushItemList (params) {
    return request('/push/feedItems?' + stringify(params) )
}

export async function getPushList (params) {
    return request('/push/List?' + stringify(params) )
}


export async function readPushRecord (data) {
    return request('/push/read?', {
        data,
        method: 'POST'
    })
}

export async function postFormId (data) {
    return request('/push/formId?', {
        data,
        method: 'POST'
    })
}
