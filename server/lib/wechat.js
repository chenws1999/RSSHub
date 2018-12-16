const request = require('request-promise-native')

const redis = require('./redis')
const {RedisKeys} = require('./enums')
const settings = require('../config/settings')

const accessTokenKey = RedisKeys.accessToken()

async function sendTemplate ({templateId, openId, page, data, formId}) {
	try {
		const access_token = await getAccessToken()
		const baseUrl ='https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send'
		const res = await request(baseUrl, {
			qs: {
				access_token,
			},
			body: {
				template_id: templateId,
				touser: openId,
				page,
				form_id: formId,
				data
			},
			method: 'POST',
			json: true
		})
		if (res.errcode) {
			throw new Error('wechat request error:' + res.errmsg)
		}
		return true
	} catch (e) {
		console.log('send template error:', e.message)
		return false
	}
}

async function getAccessToken () {
	let token = await redis.get(accessTokenKey)
	if (!token) {
		const baseUrl = 'https://api.weixin.qq.com/cgi-bin/token'
		const res = await request(baseUrl, {
			qs: {
				grant_type: 'client_credential',
				appid: settings.appId,
				secret: settings.appSecret
			},
			json: true,
			method: 'GET'
		})
		if (res.errcode) {
			throw new Error('wechat request error')
		}
		const {access_token, expires_in} = res
		token = access_token
		await redis.set(accessTokenKey, access_token, 'EX', expires_in - 5 * 60)
	}
	return token
}

module.exports = {
	sendTemplate
}