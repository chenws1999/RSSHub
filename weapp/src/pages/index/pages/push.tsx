import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import {connect} from '@tarojs/redux'
import {AtCard, AtLoadMore} from 'taro-ui'

import {PushRecord} from '../../propTypes'
import './styles/push.less'

interface ReduxPushRecord extends PushRecord {
  pushTimeStr: string
}

interface PushListProps {
    _csrf: '',
    pushList: ReduxPushRecord[],
    pushListPn: number,
    hasMore: boolean,
    pushListLoading: boolean,
    dispatch: (action: {}) => Promise<any>
}

interface PushListState {

}


@connect(({ center, pushList, loading}) => ({
  ...center,
  ...pushList,
  pushListLoading: loading.effects['center/fetchPushList']
}), null)
export default class PushList extends Component<PushListProps, PushListState> {

  static options = {
    addGlobalClass: true
  }
  config: Config = {
    navigationBarTitleText: '首页'
  }

  componentWillMount () { }

  componentDidMount () { 
    this.fetchPushList()
    this.readAllPushRecord()
  }
  componentWillUnmount () { 
    this.props.dispatch({
      type: 'pushList/saveData',
      payload: {
        pushList: [],
        hasMore: true,
      }
    })
  }
  fetchPushList (after ?: string | Object) {
    const {dispatch} = this.props
    const res = dispatch({
      type: 'pushList/fetchPushList',
      payload: {
        params: {
          after
        }
      }
    })
  }
  readAllPushRecord () {
    const {dispatch} = this.props
    dispatch({
      type: 'center/readAllPushRecord',
      payload: {
      }
    })
  }
  render () {
    const {pushList, hasMore, pushListLoading} = this.props 
    const loadMoreStatus = pushListLoading ? 'loading' : (hasMore ? 'more' : 'noMore')
    const listend = pushList[pushList.length - 1]
    return (
      <View className='pushRecordBox'>
        {pushList.map(item => {
          return <AtCard
            key={item._id}
            title="更新提醒!"
            note={item.pushTimeStr}
          >
            有{item.feeds.length}个源有更新哦!
          </AtCard>
        })}
        <AtLoadMore status={loadMoreStatus} moreText="加载更多" onClick={this.fetchPushList.bind(this, listend.pushTime)}/>
      </View>
    )
  }
}

