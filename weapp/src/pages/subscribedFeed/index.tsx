import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, RichText, Image, Button, Form } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import bindClass from 'classnames'

import Dialog from '../../components/vant-weapp/dist/dialog/dialog'
import utils from '../../utils/utils'
import MyIcon from '../../components/Icon/index'
import MyForm from '../../components/Form/index'
import { UserFeedStatus, UserFeed } from '../../propTypes'
import './index.less'



interface reduxUserFeedObj extends UserFeed {
	status: UserFeedStatus,
	statusLabel: string,
	lastUpdate: string,
	lastUpdateCount: number,
	feedIcon: string
}

interface MyFeedListProps {
	_csrf: '',
	dispatch: (action: {}) => Promise<any>,
	userFeedList: reduxUserFeedObj[],
	itemListLoading: boolean,
	isRefreshList: boolean,
	unsubscribeFeedLoading: boolean,
}

interface MyFeedListState {
}



@connect(({ center, loading, myFeed }) => ({
	...center,
	...myFeed,
	itemListLoading: loading.effects['myFeed/fetchMyFeedList'],
	unsubscribeFeedLoading: loading.effects['myFeed/unSubscribeFeed'],
}), null)
export default class FeedItemListPage extends Component<MyFeedListProps, MyFeedListState> {
	config: Config = {
		navigationBarTitleText: '我的订阅',
		usingComponents: {
			'vant-loading': '../../components/vant-weapp/dist/loading/index',
			'vant-dialog': '../../components/vant-weapp/dist/dialog/index',
			'vant-notify': '../../components/vant-weapp/dist/notify/index',
		}
	}
	formIdCount: number
	constructor(props) {
		super(props)
		this.state = {
		}
		utils.initIntercepter.call(this)
		this.formIdCount = 0
	}
	componentWillMount() { 
		this.clearReduxData()
		this.fetchMyFeedList()
	}

	componentDidMount() {
	}
	componentWillUnmount() {
		this.clearReduxData()
	}
	fetchMyFeedList(refresh = false) {
		const { dispatch } = this.props
		dispatch({
			type: 'myFeed/fetchMyFeedList',
			payload: {
				params: {
				},
				refresh
			}
		})
	}
	clearReduxData () {
		this.props.dispatch({
			type: 'myFeed/saveData',
			payload: {
				userFeedList: [],
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
	onPullDownRefresh() {
		console.log('top loading ....')
		this.fetchMyFeedList(true)
	}
	unsubscribeFeed(userFeedId, name, e: Event) {
		e.stopPropagation()
		Dialog.confirm({
			title: '确认删除',
			message: `确认要删除订阅源：${name}吗?`
		}).then(_ => {
			const { dispatch, unsubscribeFeedLoading } = this.props
			if (unsubscribeFeedLoading) {
				// todo toast
				return
			}
			dispatch({
				type: 'myFeed/unSubscribeFeed',
				payload: {
					data: {
						userFeedId
					},
					userFeedId,
				}
			})
		}).catch(_ => {

		})


	}
	gotoSubscribePage () {
		Taro.switchTab({
			url: '/pages/subscribe/index'
		})
	}
	gotoToFeedPage (feedId) {
		Taro.navigateTo({
			url: `/pages/feed/index?id=${feedId}`
		})
	}
	testBtnClick (e: Event) {
		console.log('inner click')
		e.preventDefault()
	}
	testGetUserInfo () {
		console.log('get info')
	}
	testGetUserInfo2 () {
		console.log('get info2')

	}
	handleGetFormId (id: string) {
		console.log('id:', id)
		console.log('id', ++this.formIdCount)
	}
	render() {
		const { userFeedList, itemListLoading, isRefreshList, unsubscribeFeedLoading } = this.props

		console.log(userFeedList)
		return <View className="myFeedListBox">
			<vant-notify id="van-notify" />
			<vant-dialog id="van-dialog" />
			{/* <Button onClick={this.testBtnClick.bind(this)}>
				<Button onClick={this.testBtnClick.bind(this)}>test</Button>
			</Button> */}
			{/* <MyForm num={11} onGetFormId={this.handleGetFormId.bind(this)}>测试111</MyForm> */}
			{!isRefreshList && itemListLoading &&
				<View className="loadingBox">
					<Text>加载中..</Text><vant-loading size="18px" />
				</View>
			}
			{
				!itemListLoading &&  !userFeedList.length && <View className="noData" onClick={this.gotoSubscribePage.bind(this)}>
					<Text>您还没有订阅源哦!</Text> <Text>去订阅~</Text>
				</View>
			}
			<View className="listBox">
				{userFeedList.map(item => {
					return <View key={item._id} className="itemCard" onClick={this.gotoToFeedPage.bind(this, item.feed._id)}>
						<View className="header">
							<View className={`status ${item.status}`}>
								<MyIcon type="status" />
								<Text>{item.statusLabel}</Text>
							</View>
							
						</View>
						<View className="content">
							<View className="baseFeedInfo">
								<View className="left">
									<Image src={utils.getUrl(item.feedIcon)}  lazyLoad={true} />
									<Text>{item.name}</Text>
								</View>
								<View className="delete" onClick={this.unsubscribeFeed.bind(this, item._id, item.name)}>
									<Button><MyIcon type="check" />取消订阅</Button>
								</View>
							</View>
							<View className="otherInfo">
								<Text>更新于: {item.lastUpdate}</Text>
								<Text>更新数: {item.lastUpdateCount}</Text>
							</View>
						</View>
					</View>
				})}
			</View>
		</View>
	}
}

