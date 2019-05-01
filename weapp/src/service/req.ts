import Taro from '@tarojs/taro'
import qs from 'qs'

import Notify from '../components/vant-weapp/dist/notify/notify'

let baseUrl = ''

if (process.env.NODE_ENV === 'development') {
    baseUrl = 'http://localhost:4000/api'
//  baseUrl = 'http://192.168.1.3:4000/api'
    //  baseUrl = 'http://192.168.1.4:4000/api'
//  baseUrl = 'http://192.168.0.135:4000/api'
// baseUrl = 'https://weapp.balala.co/api'

} else {
    baseUrl = 'https://weapp.balala.co/api'
}

let cookie = ''

const getCookie = () => {
    if (!cookie) {
        cookie = Taro.getStorageSync('cookie')
    }
    return cookie
}

const setCookie = str => {
    cookie = str
    Taro.setStorageSync('cookie', cookie)
}

const gotoLoginPage = (mode = 'login') => {
    const pages = Taro.getCurrentPages()
    const params = {
        mode,
        redirectUrl: '/' + pages[pages.length - 1].route,
    }
    Taro.navigateTo({
        url: '/pages/login/index?' + qs.stringify(params)
    })
}

export default function request (url, options = {}) {
    return Taro.request({
        url: baseUrl + url, 
        method: 'GET',
        header: {
            cookie: getCookie(),
            ...(options.header || {}),
        },
        ...options
    }).then(res => {
        const newCookie = res.header['set-cookie']
        if (newCookie) {
            setCookie(newCookie)
        }
        const resData = res.data
        if (resData.code === -2) {
            gotoLoginPage()
        }
        if (options.method === 'POST') {
            const color = resData.code ? 'rgb(255, 68, 68)' : '#07c160'
            const text = resData.msg || (resData.code ? '操作失败' : '操作成功')
            Notify({
                text,
                backgroundColor: color
            })
        }

        return resData
    })
}