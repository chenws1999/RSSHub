import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, RichText, Image, Button } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import bindClass from 'classnames'

import { FeedItem, FeedItemContentTypes, UserFeedItem, } from '../../propTypes'
import './index.less'

interface reduxFeedItem extends UserFeedItem {
	feedItem: FeedItem,
	descLineCount: number
}

interface PushlineProps {
	_csrf: '',
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
	constructor(props) {
		super(props)
		this.state = {
			showAllDescItems: []
		}
	}
	componentWillMount() { }

	componentDidMount() {
		console.log('inner show')
		Taro.showShareMenu()
		// Taro.startPullDownRefresh()
		this.fetchFeedItemList()
		// this.readAllPushRecord()
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
		this.fetchFeedItemList(null, true)
	}
	onReachBottom() {
		const { feedItemList, position } = this.props
		const hasMore = !!position
		console.log('iner bottom', position)
		if (!hasMore) {
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
		console.log(feedItemList, 'render')
		return <View>
			{
				feedItemList.map((item, itemIndex) => {
					const { contentType, desc, title, imgs } = item.feedItem
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
							<Text className={bindClass("iconfont", item.userCollectId ? 'icon-star-fill' : 'icon-star')} onClick={this.handleCollectAction.bind(this, itemIndex)}></Text>
							<Button openType="share" data-itemIndex={itemIndex}><Text className="iconfont icon-share"></Text></Button>
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

