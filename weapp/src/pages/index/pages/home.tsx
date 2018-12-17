import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Button,  Form } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import {
    AtCard, AtTabs, AtTabsPane, AtLoadMore, AtAvatar, AtList,
    AtListItem, AtSwipeAction, AtAccordion, AtForm, AtInput,
    AtModal, AtModalHeader, AtModalContent, AtModalAction, AtIcon,
} from 'taro-ui'

import MyPicker from '../../../components/Picker/index'
import { PushRecord, User, UserFeed, FeedOrigin, Feed, FeedOriginPriority, FeedOriginParamTypes, FeedOriginParam } from '../../propTypes'
import './styles/home.less'
import Api from '../../../service'
interface ReduxUserFeed extends UserFeed {
    updateTimeStr: string,
    updateCount: number
}

interface FeedOriginChild extends FeedOrigin {
    subscribe: boolean,
    userFeedId?: string
}

interface RedixxFeedOrigin extends FeedOrigin {
    children: FeedOriginChild[]
}

interface HomeProps {
    _csrf: '',
    user: User,
    myFeedList: ReduxUserFeed[],
    originList: ReduxFeedOrigin[],
    dispatch: (action: {}) => Promise<any>
}

interface HomeState {
    tabIndex: number,
    selectedOrigin: FeedOrigin,
    selectedUserFeed: UserFeed
    originParamsObj: {},
    customFeedName: string
}

enum TabIndexTypes { myFeeds, addFeeds }

enum SwipeOptionTypes { subscribe, unsubccribe, editUserFeed }

const tabList = [{ title: '已订阅' }, { title: '添加订阅' }]

// const FeedOriginParamTypeToComponent = {
//     [FeedOriginParamTypes.input]: AtInput,
//     [FeedOriginParamTypes.select]: Picker,
//     [FeedOriginParamTypes.multiSelect]: Picker,
// }
const parseFeedParamsValue = (range, value) => {
    let i = 0
    for (let item of range) {
        if (item.children) {
            const resIndexArr = parseFeedParamsValue(item.children, value)
            if (resIndexArr) {
                resIndexArr.unshift(i)
                return resIndexArr
            }
        } else if (item.value === value) {
            return [i]
        }
        i ++
    }
}


@connect(({ center, home }) => ({
    ...center,
    ...home
}), null)
export default class Home extends Component<HomeProps, HomeState> {

    /**
     * 指定config的类型声明为: Taro.Config
     *
     * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
     * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
     * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
     */
    static options = {
        addGlobalClass: true
      }
    config: Config = {
        navigationBarTitleText: '首页'
    }
    constructor(props) {
        super(props)
        this.state = {
            tabIndex: 0,
            selectedOrigin: null,
            selectedUserFeed: null,
            originParamsObj: {},
            customFeedName: '',
        }

    }
    componentWillMount() { }

    componentDidMount() {
        if (!this.props.user) {
            this.fetchMineInfo()
        }
        this.fetchMyFeedList()
        this.fetchFeedOriginList()
    }
    componentWillUnmount() {
        this.setReduxData({
            myFeedList: [],
            originList: []
        })
    }
    setReduxData(data) {
        this.props.dispatch({
            type: 'home/saveData',
            payload: data
        })
    }
    fetchMineInfo() {
        const { dispatch } = this.props
        const res = dispatch({
            type: 'center/fetchMineInfo',
            payload: {
                params: {
                }
            }
        })
    }
    fetchMyFeedList() {
        const { dispatch } = this.props
        const res = dispatch({
            type: 'home/fetchMyFeedList',
            payload: {
                params: {
                }
            }
        })
    }
    fetchFeedOriginList() {
        const { dispatch } = this.props
        const res = dispatch({
            type: 'home/fetchFeedOriginList',
            payload: {
                params: {
                    priority: FeedOriginPriority.main
                }
            }
        })
    }
    subscribeOrigin(originId, postParams = {}, name = '', userFeedId = '') {
        const { dispatch } = this.props
        const res = dispatch({
            type: 'home/subscribeOrigin',
            payload: {
                data: {
                    originId,
                    userFeedId,
                    postParams,
                    name
                }
            }
        }).then(res => {
            if (res.code === 0) {
                this.fetchMyFeedList()
            }
        })
    }
    unsubscribeOrigin(userFeedId: string) {
        const { dispatch } = this.props
        const res = dispatch({
            type: 'home/unsubscribeOrigin',
            payload: {
                data: {
                    userFeedId
                }
            }
        }).then(res => {
            if (res.code === 0) {
                this.fetchMyFeedList()
            }
        })
    }
    getFeedOriginItemOfEditUserFeed(userFeed: UserFeed) {
        const { feed } = userFeed
        const { dispatch } = this.props
        const res = dispatch({
            type: 'home/fetchFeedOriginItem',
            payload: {
                params: {
                    originId: feed.origin
                }
            }
        }).then(res => {
            if (res && res.code === 0) {
                const { feedOrigin } = res
                this.setState({ selectedOrigin: feedOrigin, customFeedName: userFeed.name })
                const originParamsObj = {}
                feedOrigin.params.forEach((obj: FeedOriginParam) => {
                    const { paramType, key, range } = obj
                    const obj2 = feed.params.find(obj => obj.key === key)

                    if (paramType === FeedOriginParamTypes.input) {
                        originParamsObj[key] = {
                            value: obj2.value,
                            postValue: obj2.value
                        }
                    }
                    else {
                        const indexArr = parseFeedParamsValue(range, obj2.value)
                        originParamsObj[key] = {
                            value: indexArr,
                            postValue: indexArr
                        }
                    }
                })
                this.setState({
                    originParamsObj
                })
            }
        })
    }
    setTabIndex(index) {
        this.setState({
            tabIndex: index
        })
    }
    handleSwipeOpen(e) {
        e.stopPropagation()
    }
    handleSwipeClose(e) {
        e.stopPropagation()
    }
    handleOriginSwipe(item: FeedOriginChild, config) {
        if (config.type === SwipeOptionTypes.subscribe) {
            const needParams = item.params && item.params.length
            needParams ? 
            this.setState({ 
                selectedOrigin: item, 
                selectedUserFeed: null,
                originParamsObj: {}, 
                customFeedName: item.name }) :
            this.subscribeOrigin(item._id)
        } else {
            // this.unsubscribeOrigin(item.)
        }
    }
    handleFeedSwipe(item: ReduxUserFeed, config) {

        if (config.type === SwipeOptionTypes.unsubccribe) {
            this.unsubscribeOrigin(item._id)
        }
        if (config.type === SwipeOptionTypes.editUserFeed) {
            console.log('inner')
            this.setState({selectedUserFeed: item})
            this.getFeedOriginItemOfEditUserFeed(item)
        }
    }
    preSubscribePost() { 
        const { selectedOrigin, customFeedName, originParamsObj, selectedUserFeed } = this.state
        if (!selectedOrigin || !customFeedName) {
            Taro.showToast({
                title: '请补全信息',
                icon: '',
                duration: 1000
            })
            return
        }
        const postParamsObj = {}
        for (let obj of selectedOrigin.params) {
            const {key} = obj
            const valueObj = originParamsObj[key]
            if (!valueObj || !valueObj.postValue) {
                Taro.showToast({
                    title: '请补全信息',
                    icon: '',
                    duration: 1000
                })
                return
            }
            postParamsObj[key] = valueObj.postValue
        }
        
        const userFeedId = selectedUserFeed ? selectedUserFeed._id : ''
        this.subscribeOrigin(selectedOrigin._id, postParamsObj, customFeedName, userFeedId)
        this.setState({
            selectedOrigin: null
        })
    }
    closeSubscribeModal() {
        this.setState({
            selectedOrigin: null
        })
    }
    setOriginParamsObj(obj) {
        const { originParamsObj } = this.state
        this.setState({
            originParamsObj: {
                ...(originParamsObj || {}),
                ...obj
            }
        })
    }
    handleInputChange(item: FeedOriginParam, value) {
        const { key } = item
        this.setOriginParamsObj({
            [key]: {
                value,
                postValue: value,
            },
        })
    }
    handlePickerChange(item: FeedOriginParam, value) {
        const { key, range } = item
        // console.log(value, 'vvv')
        // const idArr = []
        // let range2 = range
        // const valueIds = []
        // let textArr = []

        // value.forEach(i => {
        //     const item = range2[i]
        //     valueIds.push(item._id)
        //     textArr.push(item.label)
        //     range2 = item.children
        // })
        this.setOriginParamsObj({
            [key]: {
                value,
                postValue: value
                // postValue: valueIds,
                // showText: textArr.join('/')
            }
        })
    }
    setCustomFeedName(v) {
        this.setState({
            customFeedName: v
        })
    }
    getFormId (e) {
        const {formId} = e.detail
        console.log(formId, 'tsest')
        Api.postFormId({formId}).then(res => console.log(res))
    }
    render() {
        const { myFeedList, user, originList } = this.props
        const { tabIndex, selectedOrigin, originParamsObj, customFeedName } = this.state

        const showSubscribeModal = !!selectedOrigin
        console.log(selectedOrigin, 'selec', showSubscribeModal, showSubscribeModal === true, this.state.originParamsObj)

        const subscribeModal = <AtModal isOpened={showSubscribeModal}
            onClose={this.closeSubscribeModal.bind(this)}
        >
            {
                selectedOrigin && <View>
                    <AtModalHeader>
                        <View className="home_Modal_header">
                            <AtIcon value="close" size={24} onClick={this.closeSubscribeModal.bind(this)} />
                            <View className="home_Modal_header_title">订阅源 {selectedOrigin.name}</View>
                        </View>
                    </AtModalHeader>
                    <AtModalContent>
                        <View className="home_Modal_content">
                            <AtForm>
                                <AtInput title="备注名" value={customFeedName} onChange={this.setCustomFeedName.bind(this)} />
                            </AtForm>
                            <AtForm>
                                {
                                    selectedOrigin.params.map(obj => {
                                        const { paramType, range, name, key } = obj
                                        const temp1 = originParamsObj[key]
                                        const value = temp1 ? temp1.value : []
                                        return paramType === FeedOriginParamTypes.input ?
                                            <AtInput key={key} title={name} value={value} onChange={this.handleInputChange.bind(this, obj)} /> :
                                            <MyPicker value={value} data={range} key={key}
                                                title={name} extra={ (value.length) ? '' : '待选择'}
                                                onChange={this.handlePickerChange.bind(this, obj)} />
                                    })
                                }
                            </AtForm>
                        </View>
                    </AtModalContent>
                    <AtModalAction>
                        <Button onClick={this.closeSubscribeModal.bind(this)}>取消</Button>
                        <Button onClick={this.preSubscribePost.bind(this)} style={{ color: 'rgb(97, 144, 232)' }}>提交</Button>
                    </AtModalAction>
                </View>
            }
        </AtModal>

        const topArea = <View className="topArea">
            <View className="left">
                <AtAvatar circle image='https://jdc.jd.com/img/200' />
            </View>
            <View className="right">
                <View className="top">{user.name || '未命名'}</View>
                <View className="bottom">
                    <Form reportSubmit onSubmit={this.getFormId.bind(this)}>
                        <Button formType="submit" onf>签到</Button>
                    </Form>
                </View>
            </View>
        </View>

        const myFeedListNode = myFeedList.length ?
            <AtList>
                {
                    myFeedList.map(userFeed => {
                        const { feed } = userFeed
                        const note = !feed.lastUpdateCount ? '暂无更新' : `更新 ${feed.lastUpdateCount} +`
                        const needParams = (feed.params && feed.params.length)
                        const options = [
                            {
                                text: '取消订阅',
                                type: SwipeOptionTypes.unsubccribe,
                                style: {
                                    backgroundColor: '#6190E8'
                                }
                            }
                        ]
                        if (needParams) {
                            options.unshift({
                                text: '编辑',
                                type: SwipeOptionTypes.editUserFeed,
                                style: {
                                    backgroundColor: '#6190E8'
                                }
                            })
                        }
                        return <AtSwipeAction
                            onClick={this.handleFeedSwipe.bind(this, userFeed)}
                            key={userFeed._id}
                            options={options}
                        >
                            <AtListItem title={userFeed.name} extraText={userFeed.updateTimeStr} note={note} />
                        </AtSwipeAction>
                    })
                }
            </AtList> :
            <View className="noData">
                还没有订阅源哦~ <Text className="gotoAddFeed" onClick={this.setTabIndex.bind(this, TabIndexTypes.addFeeds)}>去添加</Text>
            </View>

        return (
            <View className='HomeBox'>
                {subscribeModal}
                {topArea}
                <AtTabs current={tabIndex} tabList={tabList} onClick={this.setTabIndex.bind(this)} swipeable={false}>
                    <AtTabsPane current={tabIndex} index={TabIndexTypes.myFeeds}>
                        {
                            myFeedListNode
                        }
                    </AtTabsPane>
                    <AtTabsPane current={tabIndex} index={TabIndexTypes.addFeeds}>
                        <View>
                            {
                                originList.map(feedOrigin => <AtAccordion title={feedOrigin.name} key={feedOrigin._id}>
                                    <AtList>
                                        {
                                            feedOrigin.children.map(origin => <AtSwipeAction
                                                key={origin._id}
                                                onClick={this.handleOriginSwipe.bind(this, origin)}
                                                onOpened={this.handleSwipeOpen.bind(this)}
                                                onClosed={this.handleSwipeClose.bind(this)}
                                                options={[
                                                    {
                                                        text: origin.subscribe ? '取消订阅' : '订阅',
                                                        type: origin.subscribe ? SwipeOptionTypes.unsubccribe : SwipeOptionTypes.subscribe,
                                                        style: {
                                                            backgroundColor: origin.subscribe ? '#FF4949' : '#6190E8'
                                                        }
                                                    }
                                                ]}
                                            >
                                                <AtListItem
                                                    title={origin.name}
                                                />
                                            </AtSwipeAction>
                                            )
                                        }
                                    </AtList>
                                </AtAccordion>)
                            }
                        </View>
                    </AtTabsPane>
                </AtTabs>
            </View>
        )
    }
}

