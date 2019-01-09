import request from './req'
import {stringify} from 'qs'

export async function login (data) {
    return request('/loginweapp', {
        data,
        method: 'POST'
    })
} 

export async function getMineInfo (params) {
    return request('/user/info?' + stringify(params) )
}

export async function getHomeInfo () {
    return request('/user/homeInfo')
}

export async function getMyFeedList (params) {
    return request('/user/myFeedList?' + stringify(params) )
}

export async function getOverview (params = {}) {
    return request('/user/overview?' + stringify(params) )
}

export async function collectItem (data) {
    return request('/user/collect', {
        method: 'POST',
        data 
    } )
}

export async function deleteCollectedItem (data) {
    return request('/user/deleteCollect', {
        method: 'POST',
        data 
    } )
}