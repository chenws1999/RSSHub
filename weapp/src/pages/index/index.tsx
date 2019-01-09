import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { AtTabs, AtTabsPane, AtTabBar } from 'taro-ui'

import OverView from './pages/overview'
import PushList from './pages/push'
import Home from './pages/home'
import Timeline from '../pushline/index'
// import Timeline from './pages/timeline'
import './index.less'

interface IndexProps {
	dispatch: (action: {}) => Promise<any>,
	unreadPushCount: number
}

interface IndexState {
	tabIndex: TabIndexTypes,
	isInit: boolean
}

enum TabIndexTypes { overview, pushMessage, home }


@connect(({ center }) => ({
	...center
}), null)
export default class Index extends Component<IndexProps, IndexState> {

	/**
	 * 指定config的类型声明为: Taro.Config
	 *
	 * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
	 * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
	 * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
	 */
	config: Config = {
		navigationBarTitleText: '首页'
	}
	constructor(props) {
		super(props)
		this.state = {
			tabIndex: null,
			isInit: false,
		}
	}
	componentWillMount() { }

	componentDidMount() {
		this.fetchUserInfo()
		Taro.showShareMenu()
	}

	componentWillUnmount() { }
	componentWillReceiveProps(nextProps) {
		console.log('next propsf', nextProps)
		if (!this.props.user && nextProps.user) {
			this.handleInit()
		}
	}
	componentDidShow() { }

	componentDidHide() { }

	handleTest() {
		console.log('click')
	}
	fetchUserInfo() {
		const { dispatch } = this.props
		const res = dispatch({
			type: 'center/fetchMineInfo',
			payload: {

			}
		})
		console.log(res)
	}
	handleInit() {
		this.setState({
			tabIndex: TabIndexTypes.overview,
			isInit: true
		})
		// Taro.setTabBarStyle({
		// 	borderStyle: 'white',
		// 	color: '#7d7e80',
		// 	selectedColor: '#1989fa',
		// })
		const tabItems = [
			{
				pagePath: "pages/index/index",
				iconPath: "static/message.png",
				selectedIconPath: 'static/message2.png',
				text: "更新"
			},
			// {
			// 	pagePath: "pages/login/index",
			// 	iconPath: 'static/user.png',
			// 	selectedIconPath: 'static/user2.png',
			// 	text: "管理"
			// }
		]
		tabItems.forEach((obj, index) => {
			Taro.setTabBarItem({
				...obj,
				index
			})
		})
	}
	handleTabClick(tabIndex) {
		this.setState({
			tabIndex
		})
	}
	render() {
		const { unreadPushCount } = this.props
		const { tabIndex, isInit } = this.state
		return (
			isInit ?
				<View className='index' >
					{
						tabIndex === TabIndexTypes.overview && <Timeline />
					}
					{
						tabIndex === TabIndexTypes.pushMessage && <PushList />
					}
					{
						tabIndex === TabIndexTypes.home && <Home />
					}
					<AtTabBar
						fixed
						tabList={[
							{ title: '概览', iconType: 'credit-card' },
							{ title: '通知', iconType: 'message', text: unreadPushCount || null },
							{ title: '管理', iconType: 'home' }
						]}
						iconSize={20}
						onClick={this.handleTabClick.bind(this)}
						current={tabIndex}
					/>
				</View> :
				<View></View>
		)
	}
}

