
import State from './state'

export interface ICollectionPayload {
    build: Function,
    observer: Function
}

export interface IUpdateTask {
    // toString id
    id: Function | String,
    task: Function
}

/**
 * key: keyName 
 * val: {buildId,observer}
 */
export interface WatcherMap {
    [key:string]:Map<Function | String,Function>
}
