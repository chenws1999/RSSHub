import request from './req'
import {stringify} from 'qs'

export async function login (data) {
    return request('/loginweapp', {
        data,
        method: 'POST'
    })
} 

export async function getBaseInfo (params) {
    return request('/user/info?' + stringify(params) )
}

export async function getHomeInfo () {
    return request('/user/homeInfo')
}

export async function getMyFeedList (params) {
    return request('/user/myFeedList?' + stringify(params) )
}

export async function collectItem (data) {
    return request('/user/collect', {
        method: 'POST',
        data 
    } )
}

export async function getMyCollectList (params) {
    return request('/user/collect/list?' + stringify(params) )
}

export async function deleteCollectedItem (data) {
    return request('/user/deleteCollect', {
        method: 'POST',
        data 
    } )
}


export async function checkIn (data) {
    return request('/user/checkIn?', {
        data,
        method: 'POST'
    })
}
