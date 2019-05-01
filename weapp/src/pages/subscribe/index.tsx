import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, RichText, Image, Button, Input } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import bindClass from 'classnames'
import pathToRegExp from 'path-to-regexp'

import utils from '../../utils/utils'
import MyIcon from '../../components/Icon/index'
import { FeedItem, UserFeedItem, FeedOrigin } from '../../propTypes'
import './index.less'

interface reduxFeedOrigin extends FeedOrigin {
	userFeedId: number,
	isImmutable: boolean
}

interface SubscribeProps {
	_csrf: '',
	dispatch: (action: {}) => Promise<any>,
	feedOriginList: reduxFeedOrigin[],
	position: string,
	originListLoading: boolean,
	subscribeLoading: boolean,
	unSubscribeLoading: boolean
}

enum FeedSubscribeActionSteps { searchFeed, setExtra, end }

const subscribeActionStepsArr = [{ text: '选择' }, { text: '提交' }]

interface SubscribeState {
}


const test = [
	{
		text: '步骤一',
		desc: '描述信息'
	},
	{
		text: '步骤二',
		desc: '描述信息'
	},
	{
		text: '步骤三',
		desc: '描述信息'
	},
	{
		text: '步骤四',
		desc: '描述信息'
	}
]

@connect(({ center, loading, subscribe }) => ({
	...center,
	...subscribe,
	originListLoading: loading.effects['subscribe/fetchFeedOriginList'],
	subscribeLoading: loading.effects['subscribe/subscribeFeed'],
	unSubscribeLoading: loading.effects['subscribe/unSubscribeFeed'],
}), null)
export default class SubscribeListPage extends Component<SubscribeProps, SubscribeState> {

	config: Config = {
		navigationBarTitleText: '可订阅源',
		usingComponents: {
			'vant-loading': '../../components/vant-weapp/dist/loading/index',
			'vant-notify': '../../components/vant-weapp/dist/notify/index',
			// 'vant-tab': '../../components/vant-weapp/dist/tab/index',
			// 'vant-tabs': '../../components/vant-weapp/dist/tabs/index',
			// 'vant-field': '../../components/vant-weapp/dist/field/index'
		}
	}
	constructor(props) {
		super(props)
		this.state = {
		}
	}
	componentWillMount() {
		this.clearReduxData()
		Taro.showShareMenu()
		this.fetchFeedOriginList()
	 }

	componentDidMount() {
		console.log('inner show')
	
	}
	componentWillUnmount() {
		this.clearReduxData()
	}
	clearReduxData () {
		this.props.dispatch({
			type: 'subscribe/saveData',
			payload: {
				feedOriginList: [],
				position: null
			}
		})
	}
	fetchFeedOriginList(position = null, refresh = false) {
		const { dispatch } = this.props
		dispatch({
			type: 'subscribe/fetchFeedOriginList',
			payload: {
				params: {
					position
				},
				refresh
			}
		})
	}
	onShareAppMessage(obj) {
		const { from, target } = obj
		console.log(obj)
		// todo share
		return {

		}
	}
	handleItemShareBtnClick() {
		console.log('inner share')
	}
	onPullDownRefresh() {
		if (this.props.originListLoading) {
			return
		}
		console.log('top loading ....')
		this.fetchFeedOriginList(null, true)
	}
	onReachBottom() {
		const { position, originListLoading } = this.props
		const hasMore = !!position
		if (!hasMore || originListLoading) {
			return
		}
		this.fetchFeedOriginList(position)
	}
	handleSubScribeAction(itemIndex, isSubscribed) {
		isSubscribed ? this.handleUnSubscribeClick(itemIndex) : this.handleSubScribeClick(itemIndex)
	}
	handleSubScribeClick(itemIndex: number) {
		const { dispatch, feedOriginList, subscribeLoading } = this.props
		const item = feedOriginList[itemIndex]
		if (subscribeLoading) {
			// todo toast
			return
		}
		console.log('inner')
		if (item.isImmutable) {
			dispatch({
				type: 'subscribe/subscribeFeed',
				payload: {
					data: {
						originId: item._id
					},
					originItemId: item._id,
					isImmutable: true
				}
			})
		} else {
			//todo 
			console.log('set')
			Taro.navigateTo({
				url: `/pages/subscribeAction/index?originId=${item._id}`
			})
		}

	}
	handleUnSubscribeClick(itemIndex: number) {
		const { dispatch, feedOriginList, unSubscribeLoading } = this.props
		const item = feedOriginList[itemIndex]
		if (unSubscribeLoading) {
			// todo toast
			return
		}
		dispatch({
			type: 'subscribe/unSubscribeFeed',
			payload: {
				data: {
					userFeedId: item.userFeedId
				},
				originItemId: item._id,
				isImmutable: item.isImmutable
			}
		})
	}
	handleHideModal() {
		this.setState({
			showModal: false
		})
		this.boforeHideSubscribeModal()
	}
	render() {
		const { position, feedOriginList, originListLoading } = this.props
		console.log('render')

		return <View>
			<vant-notify id="van-notify" />
			<View className="feedOringListBox">
				<View className="header">源列表</View>
				{
					feedOriginList.map((item, itemIndex) => {
						const isSubscribed = !!item.userFeedId
						return <View key={item._id} className="item">
							<View className="icon">
								<Image src={utils.getUrl(item.icon)}  lazyLoad={true} />
							</View>
							<View className="right">
								<View className="name">{item.name}</View>
								<View className="desc">{item.desc}</View>
							</View>
							<View className="btnArea">
								<Button className={isSubscribed ? 'checked' : 'notChecked'}
									onClick={this.handleSubScribeAction.bind(this, itemIndex, isSubscribed)}
								>
									<MyIcon type={isSubscribed ? 'check' : 'plus'} />
									<Text >{isSubscribed ? '已订阅' : '订阅'}</Text>
								</Button>
							</View>
						</View>
					})
				}
			</View>
			{
				originListLoading && <View className="bottomLoading">
					<Text>加载中...</Text><vant-loading size="16px" />
				</View>
			}
			{
				!originListLoading && !position && <View className="nomore">没有更多了....</View>
			}
		</View>
	}
}

