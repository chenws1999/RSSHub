export interface User {
    _id: string,
    createAt: string,
    updateAt: string,
    openId: string,
    name?: string
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
    params: FeedOriginParam[]
}

export interface Feed {
    _id: string,
    createAt: string,
    updateAt: string,
    origin: FeedOrigin | string,
    originCode: string,
    originType: string,
    lastUpdate: string,
    lastFetch: string,
    lastSnapshot: string | Snapshot,
    lastUpdateCount: number,
    stop: number,
    params: {
        key: string,
        value: string
    }[]
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
    pushTime: string,
    name: string,
    user: User | string,
    feed: Feed | string,
    originCode: string
}


export enum FeedOriginParamTypes { input = 'input', select = 'select', multiSelect = 'multiSelect' }
export enum FeedOriginPriority { main = 'main', second = 'second' }