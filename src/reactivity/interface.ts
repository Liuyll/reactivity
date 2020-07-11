import State from './state'

export interface ICollectionPayload {
    build: Function,
    observer: Function
}

export interface IUpdateTask {
    id: Function,
    task: Function
}

export interface WatcherMap {
    [key:string]:Map<Function,Function>
}