import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { AtCard, AtList, AtListItem, AtSwipeAction } from 'taro-ui'

import { Feed, PushRecord, UserFeed } from '../../propTypes'
import './styles/overview.less'

interface ReduxPushRecord extends PushRecord {
	pushTimeStr: string
}

interface ReduxUserFeed extends UserFeed {
	updateTimeStr: string,
	updateCount: number
}


interface OverViewProps {
	feedList: ReduxUserFeed[],
	unreadPushCount: number,
	newlyPushRecord: ReduxPushRecord,
	dispatch: (action: {}) => Promise<any>
}

@connect(({ center }) => ({
	...center
}), null)
export default class OverView extends Component<OverViewProps, {}>{

	static options = {
		addGlobalClass: true
	}
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
		const { feedList, unreadPushCount, newlyPushRecord } = this.props
		console.log(feedList)
		return (
			<View className='overviewBox' onClick={this.test}>
				<AtCard
					title="最新提醒"
					note={newlyPushRecord ? newlyPushRecord.pushTimeStr : ''}
				// thumb="bell"
				>
					{
						newlyPushRecord ?
							<View>
								{newlyPushRecord.feeds.length}个源有更新哦!
							</View> :
							<View className="noData">
								暂无数据
						</View>
					}
				</AtCard>
				<AtCard
					title="订阅源动态"
					// note={newlyPushRecord ? newlyPushRecord.pushTimeStr : ''}
				// thumb="bell"
				>
					{
						newlyPushRecord ?
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
										<AtListItem title={userFeed.name} extraText={`更新 ${userFeed.updateCount} + 条`}  note={ '更新时间' + userFeed.undateTimeStr}/>
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

