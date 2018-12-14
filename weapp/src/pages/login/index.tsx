import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { connect } from '@tarojs/redux'

import { dispatch } from '../../dva'
// import './index.less'

enum LoginModes { login, addProfile }
enum addProfileSteps { preCheck, reqUserInfoPower, reqMobilePower }

interface LoginState {
  mode: LoginModes,
  _csrf: string
  redirectUrl?: string,
  addProfileStep: addProfileSteps
}

interface EncrypteDataObj {
  encryptedData: string
  iv: string
}

@connect(({ center }) => {
  return {
    ...center
  }
})
export default class Index extends Component<{}, LoginState> {

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
  constructor(props) {
    super(props)
    const { mode, redirectUrl } = this.$router.params
    this.state = {
      mode: mode === 'login' ? LoginModes.login : LoginModes.addProfile,
      _csrf: '',
      redirectUrl,
      addProfileStep: addProfileSteps.preCheck
    }
  }
  componentWillMount() { }

  componentDidMount() {
    if (this.state.mode === LoginModes.login ) {
      this.loginPost()
    }
  }

  componentWillUnmount() { }
  fetchCsrfToken(cb) {
    dispatch({
      type: 'center/login',
      payload: {
        data: {

        }
      }
    })
      .then(res => {
        if (res && res.code === 0) {
          this.setState({
            _csrf: res._csrf
          }, cb)
          return
        }
        console.log('获取csrf失败')

      }).catch(e => {
        console.log('获取csrf失败')
      })
  }
  csrfCheck(func) {
    return _ => {
      if (!this.state._csrf) {
        this.fetchCsrfToken(func)
      } else {
        func()
      }
    }
  }
  loginPost() {
    const { _csrf, redirectUrl } = this.state
    Taro.login({
      timeout: 3000,
      success: (res) => {
        dispatch({
          type: 'center/login',
          payload: {
            data: {
              code: res.code
            }
          }
        }).then(res => {
          if (res.code === 0) {
            console.log('login success')
            Taro.redirectTo({
              url: redirectUrl || '/pages/index/index',
            })
          }
        })
      },
    })
  }
  test () {
    console.log('click')
  }
  render() {
    return (
      <View className='index'>
        <Text  onClick={this.test.bind(this)}>Hello world 22222!</Text>
      </View>
    )
  }
}
