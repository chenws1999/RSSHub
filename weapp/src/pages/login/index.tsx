import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Button } from '@tarojs/components'
import { connect } from '@tarojs/redux'

import { dispatch } from '../../dva'
import './login.less'

enum LoginSteps { preCheck, reqUserInfoPower, reqMobilePower }

interface LoginProps {
  loginPostLoading: boolean
}

interface LoginState {
  loginStep: LoginSteps
}

interface EncrypteDataObj {
  encryptedData: string
  iv: string
}

@connect(({ center, loading }) => {
  return {
    ...center,
    loginPostLoading: loading.effects['center/login']
  }
})
export default class Index extends Component<LoginProps, LoginState> {

  /**
   * 指定config的类型声明为: Taro.Config
   *
   * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
   * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
   * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
   */
  config: Config = {
    navigationBarTitleText: '首页',
    usingComponents: {
      'vant-loading': '../../components/vant-weapp/dist/loading/index',
			'vant-notify': '../../components/vant-weapp/dist/notify/index',
    }
  }
  profileData: EncrypteDataObj
  constructor(props) {
    super(props)
    this.state = {
      // _csrf: '',
      loginStep: LoginSteps.preCheck
    }
  }
  componentWillMount() { }

  componentDidMount() {
    if (this.state.loginStep === LoginSteps.preCheck) {
      this.preCheck()
    }
  }
  async preCheck() {
    const {authSetting} = await Taro.getSetting()
    if (authSetting['scope.userInfo']) {
      
      this.loginPost()
    } else {
      this.setState({
        loginStep: LoginSteps.reqUserInfoPower
      })
    }
  }
  handleGetUserInfo (e) {
    console.log('e', e)
    this.loginPost()
  }
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
    Taro.login({
      timeout: 3000,
      success: async (res) => {
        const {encryptedData, iv} = await Taro.getUserInfo({
          withCredentials: true
        })
        const profileData = {
          encryptedData,
          iv
        }
        dispatch({
          type: 'center/login',
          payload: {
            data: {
              code: res.code,
              profileData
            }
          }
        }).then(res => {
          if (res.code === 0) {
            console.log('login success')
            this.props.dispatch({
              type: 'center/fetchMineInfo'
            })
            Taro.navigateBack({
              delta: 1
            })
            return
          }
          Taro.showToast({
            title: '登录失败',
            icon: '',
            duration: 1000
          })
        }).catch(e => {
          Taro.showToast({
            title: '登录失败',
            icon: '',
            duration: 1000
          })
        })
      },
    })
  }
  render() {
    const { loginStep } = this.state
    const { loginPostLoading } = this.props
    return (
      <View className='loginBox'>
			  <vant-notify id="van-notify" />
        {
          loginStep === LoginSteps.preCheck && <View className="preCheckStepBox">
            <Text>加载中...</Text>
            <vant-loading size="16px" />
          </View>
        }
        {
          loginStep === LoginSteps.reqUserInfoPower && <View className="reqUserInfoStepBox">
            <Button openType="getUserInfo" onGetUserInfo={this.handleGetUserInfo.bind(this)}>授权登录</Button>
            {
              loginPostLoading && <View className="bottom">
                <Text>登录中...</Text>
                <vant-loading size="16px" />
              </View>
            }
          </View>
        }
      </View>
    )
  }
}