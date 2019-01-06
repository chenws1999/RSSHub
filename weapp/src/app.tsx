import Taro, { Component, Config } from '@tarojs/taro'
import {setStore} from '@tarojs/redux'
import '@tarojs/async-await'

import dvaapp from './dva'
const a = dvaapp
setStore(dvaapp._store)

import Index from './pages/index'

import './app.less'

// 如果需要在 h5 环境中开启 React Devtools
// 取消以下注释：
// if (process.env.NODE_ENV !== 'production' && process.env.TARO_ENV === 'h5')  {
//   require('nerv-devtools')
// }

class App extends Component {

  /**
   * 指定config的类型声明为: Taro.Config
   *
   * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
   * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
   * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
   */
  config: Config = {
    pages: [
      'pages/index/index',
      'pages/pushline/index',
      'pages/subscribe/index',
      'pages/subscribeAction/index',
      'pages/home/index',
      'pages/feed/index',
      'pages/login/index',
    ],
    window: {
      backgroundTextStyle: 'light',
      navigationBarBackgroundColor: '#fff',
      navigationBarTitleText: 'WeChat',
      navigationBarTextStyle: 'black',
      enablePullDownRefresh: true
    },
    tabBar: {
      borderStyle: 'white',
      color: '#7d7e80',
      selectedColor: '#1989fa',
      list: [
        {
          pagePath: "pages/index/index",
          iconPath: "static/message.png",
          selectedIconPath: 'static/message2.png',
          text: "更新"
        },
        {
          pagePath: "pages/pushline/index",
          iconPath: "static/message.png",
          selectedIconPath: 'static/message2.png',
          text: "更新"
        },
        {
          pagePath: 'pages/subscribe/index',
          iconPath: 'static/plus.png',
          selectedIconPath: 'static/plus2.png',
          text: '添加'
        },
        // {
        //   pagePath: "pages/home/index",
        //   iconPath: "static/user.png",
        //   selectedIconPath: 'static/user2.png',
        //   text: "我"
        // }
        // {
        //   pagePath: "pages/login/index",
        //   iconPath: 'static/user.png',
        //   selectedIconPath: 'static/user2.png',
        //   text: "管理"
        // }
    },
  }
  componentDidMount () {
    console.log('app start')
  }

  componentDidShow () {}

  componentDidHide () {}

  componentDidCatchError () {}

  // 在 App 类中的 render() 函数没有实际作用
  // 请勿修改此函数
  render () {
    return (
      // <Provider store={dvaapp._store}>
        <Index />
      // </Provider>
    )
  }
}

Taro.render(<App />, document.getElementById('app'))
