import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { AtTabs, AtTabsPane, AtTabBar } from 'taro-ui'

import OverView from './pages/overview'
import PushList from './pages/push'
import Home from './pages/home'
import './index.less'

interface IndexProps {
	dispatch: (action: {}) => Promise<any>
}

interface IndexState {
	tabIndex: TabIndexTypes
}

enum TabIndexTypes {overview, pushMessage, home}

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
	constructor (props) {
		super(props)
		this.state = {
			tabIndex: null
		}
	}
	componentWillMount() { }

	componentDidMount() {
		this.fetchUserInfo()
		Taro.showShareMenu()
	}

	componentWillUnmount() { }
	componentWillReceiveProps (nextProps) {
		if (!this.props.user && nextProps.user) {
			this.setState({
				tabIndex: TabIndexTypes.home
			})
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
	handleTabClick(tabIndex) {
		this.setState({
			tabIndex
		})
	}
	render() {
		const { tabIndex } = this.state
		return (
			<View className='index' >
				{
					tabIndex === TabIndexTypes.overview && <OverView/>
				}
				{
					tabIndex === TabIndexTypes.pushMessage && <PushList/>
				}
				{
					tabIndex === TabIndexTypes.home && <Home/>
				}
				<AtTabBar
					fixed
					tabList={[
						{ title: '概览', iconType: 'credit-card'},
						{ title: '通知', iconType: 'message'},
						{ title: '管理', iconType: 'home'}
					]}
					iconSize={20}
					onClick={this.handleTabClick.bind(this)}
					current={tabIndex}
				/>
			</View>
		)
	}
}

