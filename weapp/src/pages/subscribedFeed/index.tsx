import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, RichText, Image, Button } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import bindClass from 'classnames'

import Dialog from '../../components/vant-weapp/dist/dialog/dialog'
import utils from '../../utils/utils'
import MyIcon from '../../components/Icon/index'
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
		this.fetchMyFeedList()
	}
	componentWillUnmount() {
		this.props.dispatch({
			type: 'myFeed/saveData',
			payload: {
				userFeedList: [],
			}
		})
	}
	fetchMyFeedList(refresh) {
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
	unsubscribeFeed(userFeedId, name) {
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
	render() {
		const { userFeedList, itemListLoading, isRefreshList, unsubscribeFeedLoading } = this.props

		console.log(userFeedList)
		return <View className="myFeedListBox">
			<vant-dialog id="van-dialog" />
			{!isRefreshList && itemListLoading &&
				<View className="loadingBox">
					<Text>加载中..</Text><vant-loading size="18px" />
				</View>
			}
			<View className="listBox">
				{userFeedList.map(item => {
					return <View key={item._id} className="itemCard">
						<View className="header">
							<View className={`status ${item.status}`}>
								<MyIcon type="status" />
								<Text>{item.statusLabel}</Text>
							</View>
							
						</View>
						<View className="content">
							<View className="baseFeedInfo">
								<View className="left">
									<Image src={item.feedIcon || utils.getUrl('https://ss0.baidu.com/94o3dSag_xI4khGko9WTAnF6hhy/image/h%3D300/sign=bb325138dc58ccbf04bcb33a29dabcd4/aa18972bd40735faee21b63393510fb30e240862.jpg')} />
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

