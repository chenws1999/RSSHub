import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import {connect} from '@tarojs/redux'
import {AtCard, AtLoadMore} from 'taro-ui'

import {PushRecord} from '../../propTypes'
import './style.less'

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


@connect(({ center, loading}) => ({
  ...center,
  pushListLoading: loading.effects['center/fetchPushList']
}), null)
export default class PushList extends Component<PushListProps, PushListState> {

  /**
   * 指定config的类型声明为: Taro.Config
   *
   * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
   * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
   * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
   */
  config: Config = {
    navigationBarTitleText: '首页'
  }

  componentWillMount () { }

  componentDidMount () { 
    this.fetchPushList()
  }
  componentWillUnmount () { 
    this.props.dispatch({
      type: 'center/saveData',
      payload: {
        pushList: [],
        hasMore: true,
      }
    })
  }
  fetchPushList (after ?: string | Object) {
    const {dispatch} = this.props
    const res = dispatch({
      type: 'center/fetchPushList',
      payload: {
        params: {
          after
        }
      }
    })
  }
  render () {
    const {pushList, hasMore, pushListLoading} = this.props 
    const loadMoreStatus = pushListLoading ? 'loading' : (hasMore ? 'more' : 'noMore')
    const listend = pushList[pushList.length - 1]
    return (
      <View className='index'>
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

