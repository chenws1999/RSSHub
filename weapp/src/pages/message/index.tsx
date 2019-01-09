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
			'vant-loading': '../../components/vant-weapp/dist/loading/index'
		}
	}
	constructor(props) {
		super(props)
		this.state = {
		}
		utils.initIntercepter.call(this)
	}
	componentWillMount() { }

	componentDidMount() {
		console.log('inner show')
		// Taro.showShareMenu()
		// Taro.startPullDownRefresh()
		this.fetchMessageList()
		// this.readAllPushRecord()
	}
	
	componentWillUnmount() {
		this.props.dispatch({
			type: 'message/saveData',
			payload: {
				messageList: [],
				position: null,
			}
		})
	}
	fetchMessageList (position = null) {
		this.props.dispatch({
			type: 'message/fetchMessageList',
			payload: {
				params: {
					position
				}
			}
		})
	}
	gotoFeedItemPage (feedId) {
		Taro.navigateTo({
			url: `/pages/feed/index?id=${feedId}`
		})
	}
	render() {
		const {position, messageList, messageListLoading} = this.props
		const {  } = this.state
		return <View className="messageListBox">
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
		</View>
	}
}

