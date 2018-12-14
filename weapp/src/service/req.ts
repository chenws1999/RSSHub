import Taro from '@tarojs/taro'
import qs from 'qs'

// const baseUrl = 'http://192.168.1.4:4000/api'

const baseUrl = 'http://192.168.0.135:4000/api'

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
    Taro.redirectTo({
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
        return resData
    })
}