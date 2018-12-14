import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, PickerView, PickerViewColumn, Picker } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import {
    AtCard, AtTabs, AtTabsPane, AtLoadMore, AtAvatar, AtList,
    AtListItem, AtSwipeAction, AtAccordion, AtForm, AtInput,
    AtModal, AtModalHeader, AtModalContent, AtModalAction
} from 'taro-ui'

import MyPicker from '../../../components/Picker/index'
import { PushRecord, User, UserFeed, FeedOrigin, Feed, FeedOriginPriority, FeedOriginParamTypes, FeedOriginParam } from '../../propTypes'
import './styles/home.less'

interface ReduxUserFeed extends UserFeed {
    updateTimeStr: string,
    updateCount: number
}

interface FeedOriginChild extends FeedOrigin {
    subscribe: boolean,
    userFeedId?: string
}

interface ReduxFeedOrigin extends FeedOrigin {
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
    originParamsObj: {}
}

enum TabIndexTypes { myFeeds, addFeeds }

enum SwipeOptionTypes { subscribe, unsubccribe }

const tabList = [{ title: '已订阅' }, { title: '添加订阅' }]

// const FeedOriginParamTypeToComponent = {
//     [FeedOriginParamTypes.input]: AtInput,
//     [FeedOriginParamTypes.select]: Picker,
//     [FeedOriginParamTypes.multiSelect]: Picker,
// }

@connect(({ center, loading }) => ({
    ...center,
}), null)
export default class PushList extends Component<HomeProps, HomeState> {

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
        this.state = {
            tabIndex: 0,
            selectedOrigin: null,
            originParamsObj: {}
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
            type: 'center/saveData',
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
            type: 'center/fetchMyFeedList',
            payload: {
                params: {
                }
            }
        })
    }
    fetchFeedOriginList() {
        const { dispatch } = this.props
        const res = dispatch({
            type: 'center/fetchFeedOriginList',
            payload: {
                params: {
                    priority: FeedOriginPriority.main
                }
            }
        })
    }
    subscribeOrigin(originId, postParams = []) {
        const { dispatch } = this.props
        const res = dispatch({
            type: 'center/subscribeOrigin',
            payload: {
                data: {
                    originId,
                    postParams
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
            type: 'center/unsubscribeOrigin',
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
            needParams ? this.setState({ selectedOrigin: item, originParamsObj: {} }) : this.subscribeOrigin(item._id)
        } else {
            // this.unsubscribeOrigin(item.)
        }
    }
    handleFeedSwipe(item: ReduxUserFeed, config) {
        this.setState({
            tabIndex: 2
        })
        if (config.type === SwipeOptionTypes.unsubccribe) {
            this.unsubscribeOrigin(item._id)
        }
    }
    closeSubscribeModal() {
        this.setState({
            selectedOrigin: null
        })
    }
    setOriginParamsObj(obj) {
        this.setState({
            originParamsObj: {
                ...this.state.originParamsObj,
                ...obj
            }
        })
    }
    handleInputChange(item: FeedOriginParam, value) {
        const { key } = item
        this.setOriginParamsObj({
            [key]: {
                value,
                postValue: value
            },
        })
    }
    handlePickerChange(item: FeedOriginParam, value) {
        const { key, range } = item
        console.log(value, 'vvv')
        const idArr = []
        let range2 = range
        const valueIds = []

        value.forEach(i => {
            const item = range2[i]
            valueIds.push(item._id)
            range2 = item.children
        })
        this.setOriginParamsObj({
            [key]: {
                value,
                postValue: valueIds
            }
        })
    }
    render() {
        const { myFeedList, user, originList } = this.props
        const { tabIndex, selectedOrigin, originParamsObj } = this.state

        const showSubscribeModal = !!selectedOrigin
        console.log(selectedOrigin, 'selec', showSubscribeModal, showSubscribeModal === true, this.state.originParamsObj)

        const subscribeModal = <AtModal isOpened={showSubscribeModal}
            onClose={this.closeSubscribeModal.bind(this)}
        >
            {
                selectedOrigin && <View>
                    <AtModalHeader>订阅源 {selectedOrigin.name}</AtModalHeader>
                    <AtModalContent>
                        <AtForm>
                            {
                                selectedOrigin.params.map(obj => {
                                    const { paramType, range, name, key } = obj
                                    const v = originParamsObj[key] ? originParamsObj[key].value : 0
                                    return paramType === FeedOriginParamTypes.input ? <AtInput value={v} onChange={this.handleInputChange.bind(this, obj)}/> :
                                        <MyPicker value={v} data={range} key={obj.key} onChange={this.handlePickerChange.bind(this, obj)}>
                                            testtt
                                    </MyPicker>
                                })
                            }
                        </AtForm>
                    </AtModalContent>
                    <AtModalAction></AtModalAction>
                </View>
            }
        </AtModal>

        const topArea = <View className="topArea">
            <View className="left">
                <AtAvatar circle image='https://jdc.jd.com/img/200' />
            </View>
            <View className="right">
                <View className="top">{user.name || '未命名'}</View>
                <View className="bottom"></View>
            </View>
        </View>

        const myFeedListNode = myFeedList.length ?
            <AtList>
                {
                    myFeedList.map(userFeed => {
                        const { feed } = userFeed
                        const note = !feed.lastUpdateCount ? '暂无更新' : `更新 ${feed.lastUpdateCount} +`
                        return <AtSwipeAction
                            onClick={this.handleFeedSwipe.bind(this, userFeed)}
                            key={userFeed._id}
                            options={[
                                {
                                    text: '取消订阅',
                                    type: SwipeOptionTypes.unsubccribe,
                                    style: {
                                        backgroundColor: '#6190E8'
                                    }
                                }
                            ]}
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
                <AtTabs current={tabIndex} tabList={tabList} onClick={this.setTabIndex.bind(this)}>
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
                                                    // {
                                                    //     text: '取消',
                                                    //     style: {
                                                    //       backgroundColor: '#6190E8'
                                                    //     }
                                                    //   },
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

