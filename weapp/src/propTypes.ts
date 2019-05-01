export interface User {
    _id: string,
    createAt: string,
    updateAt: string,
    openId: string,
    name?: string,
    gender: number,
	headImg: string,
	city: string,
	province: string,
    country: string,
    collectCount: number,
	subscribeCount: number
}

export interface Snapshot {
    _id: string,
    createAt: string,
    updateAt: string,
    startTime: string,
    endTime: string,
    userCount: number,
    taskCount: number,
}


export interface UserSnapshot {
    _id: string,
    createAt: string,
    updateAt: string,
    pushTime: string,
    user: User,
    snapshot: Snapshot,
    unread: number,
    feeds: {
        feed: string,
        name: string,
        icon: string
        lastUpdate: string,
        lastFetch: string,
        lastSnapshot: string | Snapshot,
        lastUpdateCount: number,
    }[]
}

export interface FeedOriginParam { 
    name: string, 
    key: string, 
    paramType: FeedOriginParamTypes
    range?: {
        label: string, 
        value?: string, 
        children?: {
            label: string,
            value?: string
        }[]
    }[]
}

export interface FeedOrigin {
    _id: string,
    createAt: string,
    updateAt: string,
    type: string,
    desc: string,
    name: string,
    code: string,
    priority: string,
    tags: string[],
    stop: number,
    icon: string,
    pathToParamsRegExp: string,
    params: FeedOriginParam[]
}

export interface Feed {
    _id: string,
    createAt: string,
    updateAt: string,
    origin: FeedOrigin | string,
    originCode: string,
    originType: string,
    originName: string,
    fetchStatus: FeedFetchStatus,
    lastUpdate: string,
    lastFetch: string,
    lastSnapshot: string | Snapshot,
    lastUpdateCount: number,
    stop: number,
    params: {
        key: string,
        value: string
    }[],    
    icon: string,
    name: string
}

export interface PushRecord {
    _id: string,
    createAt: string,
    updateAt: string,
    pushTime: string,
    user: User | string,
    snapshot: Snapshot | string,
    feeds: [Feed],
    unread: number
}

export interface UserFeed {
    _id: string,
    createAt: string,
    updateAt: string,
    name: string,
    user: User | string,
    feed: Feed,
    originCode: string,
    stop: number
}

export interface FeedItem {
    _id: string,
    createAt: string,
    updateAt: string,
    snapshot: string | Snapshot,
	signature: string,
	feed: string | Feed,
    feedType: string,
    refCount: number,
    collectedCount: number,

	title: string,
	link: string,
	author: string,
	pubDate: string,
    isPrecise: number, // 是否是精确的更新时间
    contentType: FeedItemContentTypes,
    imgs: string[],
    desc: string,
}

export interface MyCollect {
    _id: string,
    createAt: string,
    updateAt: string,
    user: User,
    feedItemId: FeedItem,
    feedOriginType: string, // todo enum
	feedIcon: string, //头像地址
	feedName: string,
	userFeedItem: UserFeedItem
}
export interface UserFeedItem {
    _id: string,
    createAt: string,
    updateAt: string,
    snapshot: string | Snapshot,
	feed: string | Feed,
    user: string | User,
    feedItem: FeedItem | string,
    pubDate: string,
    feedOriginType?: string,
    feedIcon: string,
    feedName: string,
    userCollectId: string
}

export enum FeedItemContentTypes {short = 1, long = 2}
export enum FeedOriginParamTypes { input = 'input', select = 'select', multiSelect = 'multiSelect' }
export enum FeedOriginPriority { main = 'main', second = 'second' }

export enum FeedFetchStatus {
    new = 'new', // 新建 尚未进行初始化拉取
    init = 'init', // 进行了初始化拉取
    initFailed = 'initFailed', // 初始化拉取失败
    normal = 'normal', // 正常
}

export enum UserFeedStatus {
    stop = 'stop',
    init = 'init',
    initFailed = 'initFailed',
    success = 'initSuccess',
    normal = 'normal'
}