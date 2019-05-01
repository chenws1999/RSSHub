import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, RichText, Image, Button } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import bindClass from 'classnames'

import MyIcon from '../../components/Icon/index'
import utils from '../../utils/utils'
import { FeedItem, FeedItemContentTypes, UserFeedItem, User } from '../../propTypes'
import './index.less'

interface reduxFeedItem extends UserFeedItem {
	feedItemId: FeedItem,
	pubDate: string,
	collectDate: string,
	descLineCount: number
}

interface MyCollectProps {
	_csrf: '',
	user: User,
	dispatch: (action: {}) => Promise<any>,
	feedItemList: reduxFeedItem[],
	position: string,
	isRefreshList: boolean,
	itemListLoading: boolean,
	collectActionLoading: boolean,
}

interface MyCollectState {
	showAllDescItems: string[]
}

enum DescShowModes { showAll, hidden, clickShowAll }


@connect(({ center, loading, myCollect }) => ({
	...center,
	...myCollect,
	itemListLoading: loading.effects['myCollect/fetchFeedItemList'],
	collectActionLoading: loading.effects['myCollect/deleteCollectUserFeedItem' || 'myCollect/collectUserFeedItem']
}), null)
export default class Pushline extends Component<MyCollectProps, MyCollectState> {

	static options = {
		addGlobalClass: true
	}
	config: Config = {
		navigationBarTitleText: '我的收藏',
		usingComponents: {
			'vant-loading': '../../components/vant-weapp/dist/loading/index',
			'vant-notify': '../../components/vant-weapp/dist/notify/index',
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
	componentWillMount() {
		this.clearReduxData()
		Taro.showShareMenu()
		this.fetchFeedItemList()
	}

	componentDidMount() {
	}
	componentWillUnmount() {
		this.clearReduxData()
	}
	clearReduxData () {
		this.props.dispatch({
			type: 'myCollect/saveData',
			payload: {
				feedItemList: [],
				position: null,
				isRefreshList: false,
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
			type: 'myCollect/fetchFeedItemList',
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
		const { imgs = [] } = item.feedItemId
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
		dispatch({
			type: 'myCollect/deleteCollectUserFeedItem',
			payload: {
				data: {
					userCollectId: item._id
				},
				itemId: item._id
			}
		})

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
	render() {
		const { feedItemList, itemListLoading, position, isRefreshList } = this.props
		const { showAllDescItems } = this.state
		console.log(feedItemList, 'render pushline')
		return <View>
			<vant-notify id="van-notify" />
			{
				feedItemList.map((item, itemIndex) => {
					const { contentType, desc, title, imgs, link, feed: feedId } = item.feedItemId
					const isShortContent = contentType === FeedItemContentTypes.short
					const descShowMode = item.descLineCount <= 4 ? DescShowModes.showAll : (
						showAllDescItems.includes(item._id) ? DescShowModes.clickShowAll : DescShowModes.hidden
					)
					const descStr = descShowMode === DescShowModes.hidden ? desc.split('\n').slice(0, 4).join('\n') : desc
					const imgBoxClassName = imgs && bindClass('imgBox', imgs.length === 1 ? 'single' : 'multi')

					console.log(imgs, 'collect imgs', imgs[0])
					const longContentImgUrl = utils.getUrl(!isShortContent && imgs && imgs[0])
					const shortContentImgNode = imgs.map(src => <View key={src} className="itemBox">
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
								<Image onClick={this.gotoFeedPage.bind(this, feedId)} src={utils.getUrl(item.feedIcon)} lazyLoad={true} />
								<View className="itemInfo">
									<View className="name">{item.feedName}</View>
									<View className="pubDate">{item.pubDate}</View>
								</View>
							</View>
							<View className="right">
								<Text>收藏于: {item.collectDate}</Text>
								<MyIcon type="star-fill" onClick={this.handleCollectAction.bind(this, itemIndex)} />
							</View>
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
											{
												shortContentImgNode
											}
										</View>
									}

								</View> :
								<View className="content longContent">
									<Text className="desc">{desc}</Text>
									{
										imgs && imgs.length &&
										<Image src={longContentImgUrl} mode="aspectFill" className="img" lazyLoad={true} />
									}
								</View>
						}
						<View className="footer">
							<View>
								<MyIcon type="link" onClick={this.handleCopyItemLink.bind(this, link)} />
							</View>
							<View>
								<Button openType="share" data-itemIndex={itemIndex}><MyIcon type="share" /></Button>
							</View>
						</View>
					</View>
				})
			}
			{
				!isRefreshList && itemListLoading && <View className="bottomLoading">
					<Text>加载中...</Text><vant-loading size="16px" />
				</View>
			}
			{
				!itemListLoading && !position && <View className="nomore">没有更多了....</View>
			}
		</View>
	}
}

