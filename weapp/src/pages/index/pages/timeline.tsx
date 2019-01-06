import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, RichText } from '@tarojs/components'
import {connect} from '@tarojs/redux'

import {FeedItem} from '../../../propTypes'
import './styles/push.less'


interface TimelineProps {
    _csrf: '',
    dispatch: (action: {}) => Promise<any>,
    feedItemList: FeedItem[]
}

interface TimelineState {

}


@connect(({ center, loading, timeline}) => ({
    ...center,
    ...timeline,
}), null)
export default class Timeline extends Component<TimelineProps, TimelineState> {

  static options = {
    addGlobalClass: true
  }
  config: Config = {
    navigationBarTitleText: '首页'
  }

  componentWillMount () { }

  componentDidMount () { 
    this.fetchFeedItemList()
    // this.readAllPushRecord()
  }
  componentWillUnmount () { 
 
  }
  fetchFeedItemList (after ?: string | Object) {
    const {dispatch} = this.props
    const res = dispatch({
      type: 'timeline/fetchFeedItemList',
      payload: {
        params: {
          after
        }
      }
    })
  }
  render () {
    const {feedItemList} = this.props 
    return <View>
        timeline
        {
            feedItemList.map(feedItem => {
                console.log(feedItem.description)
                const str = '<img src="http://localhost:4000/api/source/img?src=http%3A%2F%2Fi0.hdslb.com%2Fbfs%2Farchive%2Fd7c43c528c0e31ce3b3c60f5ef05a722577f9e87.jpg"/>'
                const tesestr = '<img src="https://ss3.baidu.com/-fo3dSag_xI4khGko9WTAnF6hhy/image/h%3D300/sign=0fea286a34dbb6fd3a5be3263925aba6/8ad4b31c8701a18bd9e68ede932f07082838fe16.jpg"/>'
                return <RichText key={feedItem._id} nodes={feedItem.description}/>
            })
        }
    </View>
  }
}

