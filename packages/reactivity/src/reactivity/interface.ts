
type Resolve = any
export interface ICollectionPayload {
    build: Function,
    observer: Function,
    resolve ?: Resolve,
    cacheFlag ?: Symbol,
    preObserver ?: Function,
    afterObserver ?: Function
}

export interface IUpdateTask {
    // toString id
    id: Symbol,
    task: Function,
    resolve: Resolve
}

export interface IWatcherMap {
    [key:string]:Map<Symbol,IWatcherPayload>
}

export interface IWatcherPayload {
    observer: Function,
    resolve: Resolve,
    build ?: Function,
    cacheFlag ?: Symbol,
    preObserver ?: Function,
    afterObserver ?: Function
}

export type WatcherDepManage = Map<Symbol,Map<Symbol,object>>
export type PlainType = string | boolean | number | bigint
export type Ref<T extends PlainType> = {
    value: T
}