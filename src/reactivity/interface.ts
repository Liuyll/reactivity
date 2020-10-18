
type Resolve = any
export interface ICollectionPayload {
    build: Function,
    observer: Function,
    resolve ?: Resolve,
    cacheFunc ?: Function
}

export interface IUpdateTask {
    // toString id
    id: Function | String,
    task: Function,
    resolve: Resolve
}

/**
 * key: keyName 
 * val: {buildId,observer}
 */
export interface IWatcherMap {
    // [key:string]:Map<Function | String,Function>
    [key:string]:Map<Function | String,IWatcherPayload>
}

export interface IWatcherPayload {
    observer: Function,
    resolve: Resolve,
    build ?: Function,
    cacheFunc ?: Function
}

export type WatcherDepManage = Map<Function | String,Map<Symbol,object>>
export type PlainType = string | boolean | number | bigint
export type Ref<T extends PlainType> = {
    value: T
}