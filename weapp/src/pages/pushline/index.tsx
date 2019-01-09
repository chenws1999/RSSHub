import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, RichText, Image, Button } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import bindClass from 'classnames'

import MyIcon from '../../components/Icon/index'
import utils from '../../utils/utils'
import { FeedItem, FeedItemContentTypes, UserFeedItem, User} from '../../propTypes'
import './index.less'

interface reduxFeedItem extends UserFeedItem {
	feedItem: FeedItem,
	descLineCount: number
}

interface PushlineProps {
	_csrf: '',
	user: User,
	dispatch: (action: {}) => Promise<any>,
	feedItemList: reduxFeedItem[],
	position: string,
	itemListLoading: boolean,
	collectActionLoading: boolean,
}

interface PushlineState {
	showAllDescItems: string[]
}

enum DescShowModes { showAll, hidden, clickShowAll }


@connect(({ center, loading, pushline }) => ({
	...center,
	...pushline,
	itemListLoading: loading.effects['pushline/fetchUserFeedItemList'],
	collectActionLoading: loading.effects['pushline/deleteCollectUserFeedItem' || 'pushline/collectUserFeedItem']
}), null)
export default class Pushline extends Component<PushlineProps, PushlineState> {

	static options = {
		addGlobalClass: true
	}
	config: Config = {
		navigationBarTitleText: '首页',
		usingComponents: {
			'vant-loading': '../../components/vant-weapp/dist/loading/index'
		}
	}
	pureUpdateFunc: Function
	pureDidMountFunc: Function
	pureWillReceivePropsFunc: Function
	constructor(props) {
		super(props)
		this.state = {
			showAllDescItems: []
		}
		utils.initIntercepter.call(this)
	}
	componentWillMount() { }

	componentDidMount() {

		console.log('inner did mount', this.props._csrf)
			Taro.showShareMenu()
			this.fetchFeedItemList()
	}
	componentWillUnmount() {
		this.props.dispatch({
			type: 'pushline/saveData',
			payload: {
				feedItemList: [],
				position: null,
			}
		})
	}
	showListItemDescAll(key, key2) {
		console.log(key, key2)
		this.setState({
			showAllDescItems: [...this.state.showAllDescItems, key]
		})
	}
	hideListItemDescAll(key) {
		this.setState({
			showAllDescItems: this.state.showAllDescItems.filter(i => i !== key)
		})
	}
	fetchFeedItemList(position = null, refresh = false) {
		const { dispatch } = this.props
		console.log('inner ')
		const res = dispatch({
			type: 'pushline/fetchUserFeedItemList',
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
	onPullDownRefresh() {
		console.log('top loading ....')
		if (this.props.itemListLoading) {
			return
		}
		this.fetchFeedItemList(null, true)
	}
	onReachBottom() {
		const { feedItemList, position, itemListLoading } = this.props
		const hasMore = !!position
		console.log('iner bottom', position)
		if (!hasMore || itemListLoading) {
			return
		}
		this.fetchFeedItemList(position)
		console.log('loading .....')
	}
	handlePreviewItemImgs(itemIndex: number) {
		const { feedItemList } = this.props
		const item = feedItemList[itemIndex]
		const { imgs = [] } = item.feedItem
		Taro.previewImage({
			current: imgs[0],
			urls: imgs
		})
	}
	handleCollectAction(itemIndex: number) {
		const { feedItemList, dispatch, collectActionLoading } = this.props
		const item = feedItemList[itemIndex]
		if (collectActionLoading) {
			// todo toast
			return
		}
		const isCollected = !!item.userCollectId
		if (isCollected) {
			dispatch({
				type: 'pushline/deleteCollectUserFeedItem',
				payload: {
					data: {
						userCollectId: item.userCollectId
					},
					feedItemId: item._id
				}
			})
		} else {
			dispatch({
				type: 'pushline/collectUserFeedItem',
				payload: {
					data: {
						userFeedItemId: item._id,
						feedItemId: item.feedItem._id
					},
					feedItemId: item._id
				}
			}).then(isUpdate => {
				if (isUpdate) {
					this.setState({})
				}
			})
		}

	}
	gotoFeedPage(feedId) {
		Taro.navigateTo({
			url: `/pages/feed/index?id=${feedId}`
		})
	}
	render() {
		const { feedItemList, itemListLoading, position } = this.props
		const { showAllDescItems } = this.state
		console.log(feedItemList, 'render pushline')
		return <View>
			{
				feedItemList.map((item, itemIndex) => {
					const { contentType, desc, title, imgs, link } = item.feedItem
					const isShortContent = contentType === FeedItemContentTypes.short
					const descShowMode = item.descLineCount <= 4 ? DescShowModes.showAll : (
						showAllDescItems.includes(item._id) ? DescShowModes.clickShowAll : DescShowModes.hidden
					)
					const descStr = descShowMode === DescShowModes.hidden ? desc.split('\n').slice(0, 4).join('\n') : desc
					const imgBoxClassName = imgs && bindClass('imgBox', imgs.length === 1 ? 'single' : 'multi')

					return <View className="itemCard" key={item._id}>
						<View className="header">
							<View className="left">
								{/* <Text onClick={this.gotoFeedPage.bind(this)} > */}
								<Image onClick={this.gotoFeedPage.bind(this, item.feed)} src="https://ss1.baidu.com/-4o3dSag_xI4khGko9WTAnF6hhy/image/h%3D300/sign=2e1591f5382ac65c78056073cbf3b21d/3b292df5e0fe9925a8a324c539a85edf8cb171f3.jpg" style={{ width: '30px', height: '30px' }} />
								{/* </Text> */}
								<Text>{item.feedName || '测试'}</Text>
							</View>
							<View className="right">{item.pubDate}</View>
						</View>
						<View className={bindClass("content", isShortContent ? 'shortContent' : 'longContent')}>
							<View className="textBox">
								<View className="title">{title}</View>
								<View className="desc">
									{
										<Text>{descStr}</Text>
									}
									{
										descShowMode === DescShowModes.hidden && <View className="btn" onClick={this.showListItemDescAll.bind(this, item._id)}>查看全部</View>
									}
									{
										descShowMode === DescShowModes.clickShowAll && <View className="btn" onClick={this.hideListItemDescAll.bind(this, item._id)}>收起全部</View>
									}
								</View>
							</View>
							{
								imgs && imgs.length && <View
									className={imgBoxClassName}
								>
									{
										imgs.map(src => <View key={src} className="itemBox">
											<View className="placeholder"></View>
											<Image mode="aspectFill"
												className="item"
												onClick={this.handlePreviewItemImgs.bind(this, itemIndex)}
												src={src} lazyLoad={true}
											/>
										</View>)
									}
								</View>
							}

						</View>
						<View className="footer">
							<View>
								<MyIcon type="link" onClick={this.handleCopyItemLink.bind(this, link)} />
							</View>
							<View>
								<MyIcon type={item.userCollectId ? 'star-fill' : 'star'} onClick={this.handleCollectAction.bind(this, itemIndex)} />
							</View>
							<View>
								<Button openType="share" data-itemIndex={itemIndex}><MyIcon type="share" /></Button>
							</View>
							{/* <MyIcon type={item.userCollectId ? 'star-fill' : 'star'} onClick={this.handleCollectAction.bind(this, itemIndex)}/>
							<Button openType="share" data-itemIndex={itemIndex}><MyIcon type="share"/></Button> */}
						</View>
					</View>
				})
			}
			{
				itemListLoading && <View className="bottomLoading">
					<Text>加载中...</Text><vant-loading size="16px" />
				</View>
			}
			{
				!itemListLoading && !position && <View className="nomore">没有更多了....</View>
			}
		</View>
	}
}

