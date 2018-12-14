import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { AtCard, AtList, AtListItem, AtSwipeAction } from 'taro-ui'

import { Feed, PushRecord, UserFeed } from '../../propTypes'
import './style.less'

interface ReduxPushRecord extends PushRecord {
	pushTimeStr: string
}

interface ReduxUserFeed extends UserFeed {
	updateTimeStr: string,
	updateCount: number
}


interface OverViewProps {
	feedList: ReduxUserFeed[],
	unreadCount: number,
	unreadPush: ReduxPushRecord,
	dispatch: (action: {}) => Promise<any>
}

@connect(({ center }) => ({
	...center
}), null)
export default class OverView extends Component<OverViewProps, {}>{

	config: Config = {
	}

	componentWillMount() { }

	componentDidMount() {
		this.fetchOverView()
	}
	fetchOverView() {
		const { dispatch } = this.props
		const res = dispatch({
			type: 'center/fetchOverview',
			payload: {
			}
		})
	}
	render() {
		const { feedList, unreadCount, unreadPush } = this.props
		return (
			<View className='index' onClick={this.test}>
				<AtCard
					title="未读提醒"
					note={unreadPush ? unreadPush.pushTimeStr : ''}
				// thumb="bell"
				>
					{
						unreadPush ?
							<View>

							</View> :
							<View className="noData">
								暂无数据
						</View>
					}
				</AtCard>
				<AtCard
					title="订阅源动态"
					note={unreadPush ? unreadPush.pushTimeStr : ''}
				// thumb="bell"
				>
					{
						unreadPush ?
							<AtList>
								{
									feedList.map(userFeed => <AtSwipeAction
										options={[
											{
												text: '取消订阅',
												style: {
													backgroundColor: '#6190E8'
												}
											}
										]}
									>
										<AtListItem title={userFeed.name} extraText={userFeed.updateTimeStr}  note={`更新 ${userFeed.updateCount} +` }/>
									</AtSwipeAction>)
								}
							</AtList> :
							<View className="noData">
								暂无数据
						</View>
					}
				</AtCard>
			</View>
		)
	}
}

