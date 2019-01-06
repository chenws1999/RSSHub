import Taro, { Component, Config } from '@tarojs/taro'

import './index.less'

interface SubscribeProps {
  onChange: (value) => void,
}

interface SubscribeState {
}

export default class MyPicker extends Component<SubscribeProps, SubscribeState> {
  static options = {
    addGlobalClass: true
  }
  constructor(props) {
    super(props)
    this.state = {
    }
  }
  componentWillMount() {
    this.getColumns(this.props.value)
  }

  componentDidMount() {
    Taro.hideTabBar()
  }
  componentWillUnmount() {
    Taro.showTabBar()
   }
  render() {
    const { } = this.props
    const { } = this.state
   
    return (
      <View className='Box'>
        
      </View>
    )
  }
}

