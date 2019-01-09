import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, RichText, Image, Button } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import bindClass from 'classnames'

import utils from '../../utils/utils'
import MyIcon from '../../components/Icon/index'
import { FeedItem, FeedItemContentTypes, UserFeedItem, Feed} from '../../propTypes'
import './index.less'

interface reduxFeedItem extends UserFeedItem {
	feedItem: FeedItem,
	descLineCount: number
}
interface reduxFeedInfoObj extends Feed {
	subscribeTime: string,
}

interface FeedPageProps {
	_csrf: '',
	dispatch: (action: {}) => Promise<any>,
	feedItemList: reduxFeedItem[],
	position: string,
	feedInfo: reduxFeedInfoObj,
	itemListLoading: boolean,
	collectActionLoading: boolean,
}

interface FeedPageState {
	showAllDescItems: string[]
}

enum DescShowModes { showAll, hidden, clickShowAll }

const topBgColors = ['rgb(89, 171, 152)', 'rgb(89, 171, 152)', 'rgb(79, 201, 57)', 'rgb(68, 168, 225)']

@connect(({ center, loading, feed }) => ({
	...center,
	...feed,
	itemListLoading: loading.effects['feed/fetchFeedItemList'],
	collectActionLoading: loading.effects['feed/deleteCollectUserFeedItem' || 'feed/collectUserFeedItem']
}), null)
export default class FeedItemListPage extends Component<FeedPageProps, FeedPageState> {

	static options = {
		addGlobalClass: true
	}
	config: Config = {
		navigationBarTitleText: '已订阅',
		usingComponents: {
			'vant-loading': '../../components/vant-weapp/dist/loading/index'
		}
	}
	feedId: string
	bgColor: string
	constructor(props) {
		super(props)
		this.feedId = this.$router.params.id
		this.bgColor = topBgColors[Math.floor(Math.random() * topBgColors.length)]
		console.log(this.$router.params)
		this.state = {
			showAllDescItems: []
		}
		utils.initIntercepter.call(this)

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
			type: 'feed/saveData',
			payload: {
				feedItemList: [],
				position: null,
				feedInfo: null
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
		console.log(this.$router.params, this.feedId)
		dispatch({
			type: 'feed/fetchFeedItemList',
			payload: {
				params: {
					feedId: this.feedId,
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
				type: 'feed/deleteCollectUserFeedItem',
				payload: {
					data: {
						userCollectId: item.userCollectId
					},
					feedItemId: item._id
				}
			})
		} else {
			dispatch({
				type: 'feed/collectUserFeedItem',
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
	async handleCopyItemLink (linkValue) {
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
		const { feedItemList, itemListLoading, position, feedInfo } = this.props
		const { showAllDescItems } = this.state
		console.log(feedItemList, 'render')
		const header = <View className="feedHeaderBox">
				<View className="bgColorCard" style={{backgroundColor: this.bgColor}}>
					<View className="iconCard">
						<Image mode="aspectFill" src={'https://img.miidii.tech/sharecuts/avatar/PwZnZAOzdR-1541573333437.png!80x80webp'}/>
					</View>
				</View>
				<View className="contentBox">
						<View className="baseInfo">
								<View className="left">
									<View className="name">
									{feedInfo.name}
									</View>
									<View className="extra">
										订阅于: {feedInfo.subscribeTime}
									</View>
								</View>
								<View className="right">
										{/* <Button>{feedInfo ?}</Button> */}
								</View>
						</View>
						<View className="content">
								<Text>#最近更新于{' ' + feedInfo.lastUpdate}</Text>
								<Text>#最近更新数{' ' + feedInfo.lastUpdateCount}条</Text>
						</View>
				</View>
		</View>
		const listNode = <View className="itemCardListBox">
			{
				feedItemList.map((item, itemIndex) => {
					const { contentType, desc, title, imgs, link} = item.feedItem
					const isShortContent = contentType === FeedItemContentTypes.short
					const descShowMode = item.descLineCount <= 4 ? DescShowModes.showAll : (
						showAllDescItems.includes(item._id) ? DescShowModes.clickShowAll : DescShowModes.hidden
					)
					const descStr = descShowMode === DescShowModes.hidden ? desc.split('\n').slice(0, 4).join('\n') : desc
					const imgBoxClassName = imgs && bindClass('imgBox', imgs.length === 1 ? 'single' : 'multi')

					return <View className="itemCard" key={item._id}>
						<View className="header">
							<View className="left">
									<Image  src="https://ss1.baidu.com/-4o3dSag_xI4khGko9WTAnF6hhy/image/h%3D300/sign=2e1591f5382ac65c78056073cbf3b21d/3b292df5e0fe9925a8a324c539a85edf8cb171f3.jpg" style={{ width: '30px', height: '30px' }} />
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
								<MyIcon type="link" onClick={this.handleCopyItemLink.bind(this, link)}/>
							</View>
							<View>
								<MyIcon type={item.userCollectId ? 'star-fill' : 'star'} onClick={this.handleCollectAction.bind(this, itemIndex)}/>
							</View>
							<View>
								<Button openType="share" data-itemIndex={itemIndex}><MyIcon type="share"/></Button>
							</View>
							{/* <MyIcon type="link" onClick={this.handleCopyItemLink.bind(this, link)}/>
							<MyIcon type={item.userCollectId ? 'star-fill' : 'star'} onClick={this.handleCollectAction.bind(this, itemIndex)}/>
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
		return <View>
			{header}
			{listNode}
		</View>	
	}
}

