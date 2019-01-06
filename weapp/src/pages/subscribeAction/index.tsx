import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, RichText, Image, Button, Input } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import bindClass from 'classnames'
import pathToRegExp from 'path-to-regexp'

import MyIcon from '../../components/Icon/index'
import MyPicker from '../../components/Picker/index'
import { FeedItem, UserFeedItem, FeedOrigin, FeedOriginParamTypes } from '../../propTypes'
import './index.less'


interface SubscribeActionProps {
    _csrf: '',
    dispatch: (action: {}) => Promise<any>,
    preCheckLoading: boolean,
    subscribeLoading: boolean,
    focusFeedOrigin: FeedOrigin,
    searchFeedInfo: {
        title: string
    },
    isPreCheckValid: boolean
}

enum FeedSubscribeActionSteps { searchFeed, setExtra, end }
enum FeedInputMode { link, input, select }

const subscribeActionStepsArr = [{ text: '选择' }, { text: '提交' }]

interface SubscribeState {
    step: FeedSubscribeActionSteps,
    searchPathValue: string,
    isValidSearchPath: boolean,
    params: object,
    name: string
}

const stepLabelArr = [
    {
        text: '选择源'
    },
    {
        text: '配置'
    },
    {
        text: '提交'
    }
]

@connect(({ center, loading, subscribe }) => ({
    ...center,
    ...subscribe,
    subscribeLoading: loading.effects['subscribe/subscribeFeedByParams'],
    preCheckLoading: loading.effects['subscribe/preCheckSubscribeFeed'],
}), null)
export default class SubscribeAction extends Component<SubscribeActionProps, SubscribeState> {

    config: Config = {
        navigationBarTitleText: '首页',
        disableScroll: true,
        usingComponents: {
            'vant-loading': '../../components/vant-weapp/dist/loading/index',
            'vant-steps': '../../components/vant-weapp/dist/steps/index',
            'vant-field': '../../components/vant-weapp/dist/field/index'
        }
    }
    originId: string
    constructor(props) {
        super(props)
        this.state = {
            step: FeedSubscribeActionSteps.searchFeed,
            searchPathValue: '',
            isValidSearchPath: true,
            params: {},
            name: '',
        }
        this.originId = this.$router.params.originId
    }
    componentWillMount() { }

    componentDidMount() {
        this.fetchFeedOriginItem()
    }
    componentWillUnmount() {
        this.props.dispatch({
            type: 'subscribe/saveData',
            payload: {
                focusFeedOrigin: null,
                searchFeedInfo: null
            }
        })
    }
    fetchFeedOriginItem() {
        const { dispatch } = this.props
        dispatch({
            type: 'subscribe/fetchFeedOriginItem',
            payload: {
                params: {
                    originId: this.originId
                },
            }
        })
    }
    preCheckSubscribeFeed() {
        const { dispatch, focusFeedOrigin } = this.props
        const { params } = this.state
        dispatch({
            type: 'subscribe/preCheckSubscribeFeed',
            payload: {
                params: {
                    paramsObj: params,
                    feedOriginId: focusFeedOrigin._id
                }
            }
        })
    }
    handleSubScribeClick(itemIndex: number) {
        const { dispatch, focusFeedOrigin, subscribeLoading } = this.props
        const { params, name } = this.state
        if (subscribeLoading) {
            // todo toast
            return
        }
        dispatch({
            type: 'subscribe/subscribeFeedByParams',
            payload: {
                data: {
                    originId: focusFeedOrigin._id,
                    name,
                    postParams: params
                },
            }
        }).then(res => {
            if (res && res.code === 0) {
                console.log('success')
                this.setState({
                    step: FeedSubscribeActionSteps.end
                })
            }
        })

    }
    handleSeachValueInput(e) {
        const searchPathValue = e.detail.value
        const { focusFeedOrigin, dispatch } = this.props
        let isValid = true
        this.setState({
            searchPathValue
        })
        dispatch({
            type: 'subscribe/saveData',
            payload: {
                isPreCheckValid: false,
                searchFeedInfo: null
            }
        })

        const params = {}
        try {
            const paramsInfoArr: { name: string }[] = []
            const pathRegExp = pathToRegExp(focusFeedOrigin.pathToParamsRegExp, paramsInfoArr, { end: false })
            // const pathRegExp = pathToRegExp('www.jianshu.com/u/:id', paramsInfoArr, { end: false })
            const urlObj = new webkitURL(searchPathValue)
            const testValue = urlObj.hostname + urlObj.pathname
            const parsedData = pathRegExp.exec(testValue) || []
            const parsedValueArr = parsedData.slice(1)

            parsedData.slice(1).forEach((value, index) => {
                const paramInfo = paramsInfoArr[index]
                const paramKey = paramInfo.name
                params[paramKey] = value
            })

            isValid = paramsInfoArr.every(({ name: key }, index): boolean => {
                const value = parsedValueArr[index]
                params[key] = value
                return !!value
            })

            console.log(params, isValid)
        } catch (e) {
            console.log(e)
            isValid = false
        }
        this.setState({
            isValidSearchPath: isValid
        })
        this.setFeedParams(params, true)

    }
    handleInputModeValueChange(key, e) {
        console.log(key, e, { [key]: e.detail.value })
        this.setFeedParams({ [key]: e.detail })
    }
    handleSelectModeValueChange(key, value) {
        const { focusFeedOrigin: { params = [] } } = this.props
        this.setFeedParams({ [key]: value })

        let initFeedName = ''
        const paramConfigObj = params.find(i => i.key === key)
        if (paramConfigObj) {
            let rangeArr = paramConfigObj.range
            initFeedName = value.map(index => {
                const item = rangeArr[index]
                rangeArr = item.children
                return item.label
            }).join('-')
        }
        this.setState({
            name: initFeedName
        })
    }
    setFeedParams(obj, refresh = false) {
        if (refresh) {
            this.setState({
                params: obj
            })
        } else {
            this.setState({
                params: {
                    ...this.state.params,
                    ...obj
                }
            })
        }
    }
    handleNameInput(e) {
        this.setState({
            name: e.detail
        })
    }
    handleBackBtnClick() {
        const { step } = this.state
        if (step === FeedSubscribeActionSteps.searchFeed) {
            Taro.navigateBack()
            return
        }
        if (step === FeedSubscribeActionSteps.setExtra) {
            this.setState({
                step: step - 1
            })
        }
    }
    handleNextBtnClick() {
        const { step } = this.state
        const { searchFeedInfo } = this.props
        if (step === FeedSubscribeActionSteps.searchFeed) {
            if (searchFeedInfo) {
                this.setState({
                    name: searchFeedInfo.title
                })
            }
            this.setState({
                step: FeedSubscribeActionSteps.setExtra
            })
            return
        }
    }
    handleNavigateBack() {
        Taro.navigateBack()
    }
    render() {
        const { focusFeedOrigin, preCheckLoading, isPreCheckValid, searchFeedInfo } = this.props
        const { step, searchPathValue, params, name, isValidSearchPath } = this.state
        console.log('render')

        // const step2Node = <View>
        //     {
        //         paramsConfigArr.map(obj => {
        //             const {key} = obj
        //             return <View>
        //                 <vant-field value={params[key]} border placeholder={}/>
        //             </View>
        //         })
        //     }
        // </View>
        let searchFeedInputMode = null
        if (focusFeedOrigin) {
            if (focusFeedOrigin.pathToParamsRegExp) {
                searchFeedInputMode = FeedInputMode.link
            } else {
                const paramsConfigArr = focusFeedOrigin.params || []
                paramsConfigArr.some(obj => {
                    if (obj.paramType === FeedOriginParamTypes.input) {
                        searchFeedInputMode = FeedInputMode.input
                        return true
                    }
                    if (obj.paramType === FeedOriginParamTypes.select) {
                        searchFeedInputMode = FeedInputMode.select
                        return true
                    }
                })
            }
        }

        const isPrecheck = [FeedInputMode.link, FeedInputMode.input].includes(searchFeedInputMode)

        const paramsConfigArr = focusFeedOrigin ? (focusFeedOrigin.params || []) : []
        return <View className="box">
            <vant-steps customClass="stepClass" steps={stepLabelArr} active={step} activeColor="#1989fa" />
            <View className="content">
                {
                    step === FeedSubscribeActionSteps.searchFeed &&
                    (
                        focusFeedOrigin && (
                            <View className="searchStepBox">
                                <View className="mainArea">
                                    {
                                        searchFeedInputMode === FeedInputMode.link &&
                                        <View className="linkInputBox">
                                            <Input className={bindClass(!isValidSearchPath && 'notValid')} value={searchPathValue} placeholder="请输入订阅目标的链接地址" onInput={this.handleSeachValueInput.bind(this)} />
                                        </View>
                                    }
                                    {
                                        searchFeedInputMode === FeedInputMode.input &&
                                        <View>
                                            {
                                                paramsConfigArr.map(obj => {
                                                    const { key } = obj
                                                    return <View key={key}>
                                                        <vant-field label={obj.name} value={params[key]} border={true} onInput={this.handleInputModeValueChange.bind(this, key)} placeholder={`请输入${obj.name}`}/>
                                                    </View>
                                                })
                                            }
                                        </View>
                                    }
                                    {
                                        searchFeedInputMode === FeedInputMode.select &&
                                        <View>
                                            {
                                                paramsConfigArr.map(obj => {
                                                    const { range, key } = obj
                                                    const value = params[key] || []
                                                    return <MyPicker value={value} data={range} key={key}
                                                        title={obj.name} extra={(value.length) ? '' : '待选择'}
                                                        onChange={this.handleSelectModeValueChange.bind(this, key)} />
                                                })
                                            }
                                        </View>
                                    }
                                    {
                                        isPrecheck &&
                                        <View className="preCheckArea">
                                            <View className="btnArea">
                                                <Button className={bindClass(!isValidSearchPath && 'disabled')} disabled={!isValidSearchPath} onClick={this.preCheckSubscribeFeed.bind(this)}>查询</Button>
                                    {preCheckLoading && <vant-loading  size="16px"/> }
                                            </View>
                                            <View className="searchFeedInfoBox">
                                                {preCheckLoading && <Text className="preCheckLoadingText" onClick={this.handleSeachValueInput.bind(this)}>查询中....</Text>}
                                                {
                                                    searchFeedInfo && <View className="searchFeedInfo">
                                                        搜索到: {' ' + searchFeedInfo.title}
                                                    </View>
                                                }
                                            </View>
                                        </View>
                                    }
                                </View>

                                <View className="bottom">
                                    <Button className="backBtn" onClick={this.handleBackBtnClick.bind(this)}>返回</Button>
                                    <Button className="nextBtn" onClick={this.handleNextBtnClick.bind(this)}>下一步</Button>
                                </View>
                            </View>

                        )
                    )
                }
                {
                    step === FeedSubscribeActionSteps.setExtra &&
                    <View className="preSubmitStepBox">
                        <View className="mainArea">
                            <vant-field label="备注名" value={name} border placeholder="请输入源备注名" onInput={this.handleNameInput.bind(this)} />
                        </View>
                        <View className="bottom">
                            <Button className="backBtn" onClick={this.handleBackBtnClick.bind(this)}>上一步</Button>
                            <Button className="nextBtn" onClick={this.handleSubScribeClick.bind(this)}>提交</Button>
                        </View>
                    </View>
                }
                {
                    step === FeedSubscribeActionSteps.end &&
                    <View className="endStepBox">
                        <View className="mainArea">
                            <MyIcon type="check" /><Text>提交成功!</Text>
                        </View>
                        <Button onClick={this.handleNavigateBack.bind(this)}>返回</Button>
                    </View>
                }
            </View>

        </View>
    }
}

