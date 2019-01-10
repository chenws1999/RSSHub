import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image, Button } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import bindClass from 'classnames'

import Dialog from '../../components/vant-weapp/dist/dialog/dialog'
import utils from '../../utils/utils'
import { User } from '../../propTypes'
import './index.less'

interface reduxUser extends User {
	joinDays: number,
}

interface HomeProps {
	_csrf: '',
	dispatch: (action: {}) => Promise<any>,
	infoLoading: boolean,
	homeUserInfo: reduxUser,
}

interface HomeState {
	name: string,
	headImg: string,
	joinDays: number,
	collectCount: number,
	subscribeCount: number
}

const refreshTime = 800
const refreshInterval = 17 // ms

let count = 0

@connect(({ center, loading, home }) => ({
	...center,
	...home,
	infoLoading: loading.effects['home/fetchHomeUserInfo'],
}), null)
export default class Home extends Component<HomeProps, HomeState> {

	static options = {
	}
	config: Config = {
		navigationBarTitleText: '主页',
		enablePullDownRefresh: false,
		usingComponents: {
			'vant-loading': '../../components/vant-weapp/dist/loading/index'
			'vant-dialog': '../../components/vant-weapp/dist/dialog/index'
		}
	}
	originCountObj: {
		joinDays: number,
		collectCount: number,
		subscribeCount: number,
	}
	increaseCountObj: {
		joinDays: number,
		collectCount: number,
		subscribeCount: number,
	}
	timerId: any
	constructor(props) {
		super(props)
		this.state = {
			name: '',
			headImg: '',
			joinDays: null,
			collectCount: null,
			subscribeCount: null,
		}
	}
	componentWillMount() { }

	componentDidMount() {
		console.log('inner show')
		// Taro.startPullDownRefresh()
		this.fetchHomeUserInfo()
		// this.readAllPushRecord()
	}
	componentWillUnmount() {

	}

	fetchHomeUserInfo(position = null, refresh = false) {
		const { dispatch } = this.props
		console.log('inner ')
		const res = dispatch({
			type: 'home/fetchHomeUserInfo',
			payload: {
			}
		}).then((userInfo: reduxUser) => {
			if (userInfo) {
				console.log(userInfo, 'userinfo')
				const { joinDays, collectCount, subscribeCount, headImg, name } = userInfo
				this.setState({
					headImg,
					name
				})
				this.originCountObj = {
					joinDays,
					collectCount,
					subscribeCount,
				}
				this.increaseCountObj = {}
				// setTimeout(this.startRefreshCount.bind(this, Object.keys(this.originCountObj)), refreshInterval)
				this.timerId = setInterval(this.startRefreshCount.bind(this, Object.keys(this.originCountObj)), refreshInterval)
			}
		})
	}
	startRefreshCount(keys) {
		console.log('keys', keys, count++, this.increaseCountObj)
		let validCount = 0
		keys.forEach(key => {
			const originValue = this.originCountObj[key]
			let increaseCount = this.increaseCountObj[key]
			if (!increaseCount) {
				const i = originValue / (Math.floor(refreshTime / refreshInterval))
				increaseCount = i > 1 ? Math.ceil(i) : Number(i.toFixed(3))
				this.increaseCountObj[key] = increaseCount
			}

			const nowValue = this.state[key] || 0
			if (nowValue >= originValue) {
				this.setState({
					[key]: originValue
				})
				validCount++
			} else {
				this.setState({
					[key]: nowValue + increaseCount
				})
			}
		})

		if (validCount !== keys.length) {
			// setTimeout(this.startRefreshCount.bind(this, keys), refreshInterval)
		} else {
			clearInterval(this.timerId)
		}

	}
	onShareAppMessage(obj) {
		const { from, target } = obj
		console.log(obj)
		// todo share
		return {

		}
	}
	gotoMenuPage (url) {
		if (!url) {
			Dialog.alert({
				title: '未开放',
				message: '紧张准备中....'
			})
			return
		}
		Taro.navigateTo({
			url
		})
	}
	render() {
		const { name, headImg, subscribeCount, collectCount, joinDays } = this.state
		return <View className="homeBox">
			<vant-dialog id="van-dialog"/>
			<View className="header">
				<View className="left">
					<View className="headimg">
						<Image src={utils.getUrl(headImg)} />
					</View>
					<View className="name">{name}</View>
				</View>
				<View className="right">
					<View className="item">
						<Text className="label">已加入</Text>
						<View className="value">
							<Text className="count">{joinDays === null ? '-' : Math.floor(joinDays)}</Text>
							<Text className="unit">天</Text>
						</View>
					</View>
					<View className="item">
						<Text className="label">已订阅</Text>
						<View className="value">
							<Text className="count">{subscribeCount === null ? '-' : Math.floor(subscribeCount)}</Text>
							<Text className="unit">个</Text>
						</View>
					</View>
					<View className="item">
						<Text className="label">已收藏</Text>
						<View className="value">
							<Text className="count">{collectCount === null ? '-' : Math.floor(collectCount)}</Text>
							<Text className="unit">条</Text>
						</View>
					</View>
				</View>
			</View>
			<View className="menu">
				{/* <View className="menuItem">我的消息</View> */}
				<View className="menuItem" onClick={this.gotoMenuPage.bind(this, '/pages/myCollect/index')}>我的收藏</View>
				<View className="menuItem" onClick={this.gotoMenuPage.bind(this, null)}>帮助与反馈</View>
			</View>
		</View>
	}
}

