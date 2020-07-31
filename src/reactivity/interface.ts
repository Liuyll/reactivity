
import State from './state'

type Resolve = any
export interface ICollectionPayload {
    build: Function,
    observer: Function,
    resolve ?: Resolve
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
export interface WatcherMap {
    // [key:string]:Map<Function | String,Function>
    [key:string]:Map<Function | String,IWatcherPayload>
}

export interface IWatcherPayload {
    observer: Function,
    resolve: Resolve
}
