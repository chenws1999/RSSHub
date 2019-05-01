import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, RichText, Image, Button } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import bindClass from 'classnames'

import MyIcon from '../../components/Icon/index'
import MyForm from '../../components/Form/index'
import utils from '../../utils/utils'
import { FeedItem, FeedItemContentTypes, UserFeedItem, User } from '../../propTypes'
import './index.less'

interface reduxFeedItem extends UserFeedItem {
	feedItem: FeedItem,
	descLineCount: number
}

interface PushlineProps {
	_csrf: '',
	user: User,
	showCheckInModal: boolean,
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

const FormIdCount = 20
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
		navigationBarTitleText: '动态',
		usingComponents: {
			'vant-loading': '../../components/vant-weapp/dist/loading/index',
			'vant-notify': '../../components/vant-weapp/dist/notify/index',
			'vant-dialog': '../../components/vant-weapp/dist/dialog/index'
		}
	}
	pureUpdateFunc: Function
	pureDidMountFunc: Function
	pureWillReceivePropsFunc: Function
	isInit: boolean
	formIds: string[]
	constructor(props) {
		super(props)
		this.state = {
			showAllDescItems: []
		}
		this.formIds = []
	}
	componentWillMount() { 
		// console.log('will unmount')
		// Taro.hideTabBar()
		
	}

	componentDidMount() {
		if (!this.props.user) {
			this.props.dispatch({
				type: 'center/fetchMineInfo',
			})
		} else {
			this.clearData()
			this.initFunc()
		}
	}
	componentWillReceiveProps (nextProps) {
		if (!this.props.user && nextProps.user && !this.isInit) {
			this.isInit = true
			this.initFunc()
		}
	}
	componentWillUnmount() {
		console.log('un mount')
		this.clearData()
	}
	clearData () {
		this.props.dispatch({
			type: 'pushline/saveData',
			payload: {
				feedItemList: [],
				position: null,
			}
		})

	}
	initFunc () {
		console.log('init')
		Taro.showTabBar()
		Taro.showShareMenu()
		this.fetchFeedItemList()
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
		console.log('inner  fetch')
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
		console.log('inner action', collectActionLoading)

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
	async handleCopyItemLink(linkValue) {
		await Taro.setClipboardData({
			data: linkValue
		})
		Taro.showToast({
			title: '链接复制成功',
			icon: 'success',
			duration: 1000
		})
	}
	gotoSubscribePage () {
		Taro.switchTab({
			url: '/pages/subscribe/index'
		})
	}
	handleGetFormId (id: string) {
		this.formIds.push(id)
		if (this.formIds.length === FormIdCount) {
			console.log('submit')
			this.props.dispatch({
				type: 'center/checkIn',
				payload: {
					data: {
						formIds: this.formIds,
					}
				}
			})
		}
	}
	render() {
		const { feedItemList, itemListLoading, position, showCheckInModal } = this.props
		const { showAllDescItems } = this.state
		console.log(feedItemList, 'render pushline')

		return <View>
			<vant-notify id="van-notify" />
			<vant-dialog show={showCheckInModal}  use-slot={true} show-cancel-button={false} show-confirm-button={false}>
				<View className="checkinBox">
					<View className="text">签到解锁更多功能哦！</View>
					<View className="checkInBtn">
						<MyForm num={FormIdCount} onGetFormId={this.handleGetFormId.bind(this)}>
							<View className="btnArea">
								签到
							</View>
						</MyForm>
					</View>
				</View>
			</vant-dialog>
			{
				feedItemList.map((item, itemIndex) => {
					const { contentType, desc, title, imgs = [], link } = item.feedItem
					const isShortContent = contentType === FeedItemContentTypes.short
					const descShowMode = item.descLineCount <= 4 ? DescShowModes.showAll : (
						showAllDescItems.includes(item._id) ? DescShowModes.clickShowAll : DescShowModes.hidden
					)
					const descStr = descShowMode === DescShowModes.hidden ? desc.split('\n').slice(0, 4).join('\n') : desc
					const imgBoxClassName = imgs && bindClass('imgBox', imgs.length === 1 ? 'single' : 'multi')

					const longContentImgUrl = utils.getUrl(!isShortContent && imgs && imgs[0])
					const shortCotentImgs = item.feedItem.imgs 
					const shortImageNode = shortCotentImgs.map(src => <View key={src} className="itemBox">
							<View className="placeholder"></View>
							<Image mode="aspectFill"
								className="item"
								onClick={this.handlePreviewItemImgs.bind(this, itemIndex)}
								src={utils.getUrl(src)} lazyLoad={true}
							/>
						</View>)
					
					return <View className="itemCard" key={item._id}>
						<View className="header">
							<View className="left">
								{/* <Text onClick={this.gotoFeedPage.bind(this)} > */}
								<Image onClick={this.gotoFeedPage.bind(this, item.feed)} src={utils.getUrl(item.feedIcon)} lazyLoad={true} style={{ width: '30px', height: '30px' }} />
								{/* </Text> */}
								<Text>{item.feedName}</Text>
							</View>
							<View className="right">{item.pubDate}</View>
						</View>
						{
							isShortContent ?
								<View className="content shortContent">
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
											{shortImageNode}
										</View>
									}

								</View> :
								<View className="content longContent">
									<Text className="desc">{desc}</Text>
									{
										imgs && imgs.length &&
										<Image src={longContentImgUrl} mode="aspectFill" className="img" lazyLoad={true}/>
									}
								</View>
						}
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
				!itemListLoading && !position && (
					feedItemList.length ? <View className="nomore">没有更多了....</View> :
						<View className="noData" onClick={this.gotoSubscribePage.bind(this)}>
							<Text>您还没有订阅源哦!</Text> <Text>去订阅~</Text>
						</View>
				)
			}
		</View>
	}
}

