import Taro, { Component, Config } from '@tarojs/taro'
import {Text} from '@tarojs/components'

import './style.less'

interface IconProps {
    type: string,
    onClick?: () => void
}

interface IconState {
}

export default class MyIcon extends Component<IconProps, IconState> {
  static options = {
    addGlobalClass: true
  }
  constructor(props) {
    super(props)
    this.state = {
    }
  }
  componentWillMount() {
  }

  componentDidMount() {
  }
  componentWillUnmount() {
   }
  render() {
    const { type, onClick} = this.props
   
    return <Text className={`iconfont icon-${type}`} onClick={onClick}></Text>
  }
}

