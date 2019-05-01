import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Button } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import bindClass from 'classnames'

import utils from '../../utils/utils'
import MyIcon from '../../components/Icon/index'
import {UserSnapshot} from '../../propTypes'
import './index.less'

interface reduxMessageItem extends UserSnapshot {

}

interface MessageProps {
	_csrf: '',
	dispatch: (action: {}) => Promise<any>,
	messageList: reduxMessageItem[],
	isRefreshListLoading: boolean,
	position: string,
	messageListLoading: boolean
}

interface MessageState {
}



@connect(({ center, loading, message }) => ({
	...center,
	...message,
	messageListLoading: loading.effects['message/fetchMessageList'],
}), null)
export default class MessagePage extends Component<MessageProps, MessageState> {
	static options = {
		addGlobalClass: true
	}
	config: Config = {
		navigationBarTitleText: '消息',
		usingComponents: {
			'vant-loading': '../../components/vant-weapp/dist/loading/index',
			'vant-notify': '../../components/vant-weapp/dist/notify/index',
		}
	}
	constructor(props) {
		super(props)
		this.state = {
		}
		utils.initIntercepter.call(this)
	}
	componentWillMount() {
		this.clearReduxData()
		this.fetchMessageList()
	 }

	componentDidMount() {
	}
	
	componentWillUnmount() {
		this.clearReduxData()
	}
	clearReduxData () {
		this.props.dispatch({
			type: 'message/saveData',
			payload: {
				messageList: [],
				position: null,
				isRefreshListLoading: false
			}
		})
	}
	fetchMessageList (position = null, refresh = false) {
		this.props.dispatch({
			type: 'message/fetchMessageList',
			payload: {
				params: {
					position
				},
				refresh
			}
		})
	}
	onPullDownRefresh () {
		this.fetchMessageList(null, true)
	}
	onReachBottom () {
		const {messageListLoading, position} = this.props
		if (messageListLoading || !position) {
			return 
		}
		this.fetchMessageList(position)
	}
	gotoFeedItemPage (feedId) {
		Taro.navigateTo({
			url: `/pages/feed/index?id=${feedId}`
		})
	}
	render() {
		const {position, messageList, messageListLoading, isRefreshListLoading} = this.props
		const {  } = this.state
		return <View className="messageListBox">
			<vant-notify id="van-notify" />
			{
				messageList.map((item, itemIndex) => {
					return <View key={itemIndex} className="item">
						<View className="pushTime">{item.createAt}</View>
						<View className="content">
							{
								item.feeds.map(obj => {
									return <View key={obj.feed} className="feedItem">
										<Text className="left">{obj.name}</Text>
										<Text className="right" onClick={this.gotoFeedItemPage.bind(this, obj.feed)}>更新了{obj.lastUpdateCount}条</Text>
									</View>
								})
							}
						</View>
					</View>
				})
			}
			{
				!isRefreshListLoading && messageListLoading && <View className="bottomLoading">
					<Text>加载中...</Text><vant-loading size="16px" />
				</View>
			}
			{
				!messageListLoading && !position && (
					messageList.length ? <View className="nomore">没有更多了....</View> :
						<View className="noData" onClick={this.gotoSubscribePage.bind(this)}>
							<Text>您还没有消息哦!</Text>
						</View>
				)
			}
		</View>
	}
}

