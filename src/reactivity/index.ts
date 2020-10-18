import { ICollectionPayload, IUpdateTask, IWatcherMap, IWatcherPayload, WatcherDepManage, PlainType, Ref } from './interface';
import Session from './session'
import State from './state'
import _symbol from './symbol'
import React = require('react')
import { setCurrentWaitingUpdateComp,clearCurrentWaitingUpdateComp,currentWaitingUpdateComp } from '../mixInReact/mixInReact'

let realReact:React
const collectionSession = new Session()
const currentTaskPool = new Set()
const oldWatcherDepManage: WatcherDepManage = new Map()
const curWatcherDepManage: WatcherDepManage = new Map()
const LIMBO_MAGIC_NUMBER = '$limbo_magic_number'

const noop = () => {}
const clearTaskPool = () => currentTaskPool.clear()
const addDepToWatcherManage = (id: String | Function, stateFlag:Symbol,state:State,key) => {
    let depManage:Map<Symbol,object> | null
    if((depManage = curWatcherDepManage.get(id))) {
        let depRepo:object | null
        if((depRepo = depManage.get(stateFlag))) depRepo[key] = true
        else depManage.set(stateFlag,{
            [_symbol.state]:state,
            [key]: true
        })
    }

    else curWatcherDepManage.set(id,new Map([
        [stateFlag,{
            [_symbol.state]:state,
            [key]: true
        }]
    ]))
}

const buildMagicHashString = (watcherHash:string,order:number):string => watcherHash + LIMBO_MAGIC_NUMBER + order
const makeId = (type:Function) => type.toString()
// @deprecated
const createDepManage = (id:Symbol,payload:object) => new Map([[id,payload]])

let transactionId = []
let pending = false

const startTransaction = () => transactionId.length = 0
const endTransaction = startTransaction

const updateTask:IUpdateTask[] = []
const isPlainObject = (obj:any) => obj && (typeof obj === 'object')

const flush = () => {
    startTransaction()
    
    updateTask.forEach(task => {
        const id = task.id
        const update = task.task
        const resolve = task.resolve

        if(!~transactionId.indexOf(id)) {
            transactionId.push(task.id)
            beginCollection(update,{resolve} as ICollectionPayload)
        }
    })

    endTransaction()
    endPendingUpdate()
    clearTaskPool()
    clearCurrentWaitingUpdateComp()
}

const ReactiveStateProxy = (state:State) => {
    if(typeof state !== 'object') return state
    if(state.origin !== state.state) return state

    const origin = state.origin
    const innerState = state.state
    const stateFlag = state[_symbol.flag] as Symbol
    
    let proxyState = new Proxy(origin,{
        get(target,key:any){
            if(key === 'origin') return origin
            if(key === _symbol.proxy2state) return state
            const currentSession = collectionSession.peer()
            if(!currentSession) return innerState[key] instanceof State ? innerState[key].state : innerState[key]

            // 持有这个依赖的watcherMap
            const currentDepWatchMap = state[_symbol.watchMap] as IWatcherMap
            const watcher = makeId(currentSession.build)
            const watcherPayload:IWatcherPayload = {
                observer:currentSession.observer,resolve:currentSession.resolve,build:currentSession.build,cacheFunc:currentSession.cacheFunc
            }
            /**
             * string为id的watcher可能被多个相同组件覆盖
             * 此时添加magic数字标识相同组件的不同调用
             * 最终需要在每轮更新后清除掉对应的currentDepWatchMap
             */
            if(!currentDepWatchMap[key]) currentDepWatchMap[key] = new Map<Function | String,IWatcherPayload>([[watcher,watcherPayload]])
            else {
                let maybeWatcherHash = watcher,
                    maybeOrder = 1
                while(currentDepWatchMap[key].get(maybeWatcherHash)) {
                    maybeWatcherHash = buildMagicHashString(watcher,maybeOrder)
                    maybeOrder++
                }
                currentDepWatchMap[key].set(maybeWatcherHash,watcherPayload)
            }

            addDepToWatcherManage(watcher,stateFlag,state,key)
            if(isPlainObject(target[key])) return (innerState[key] = ReactiveStateProxy(innerState[key])).state

            return target[key]
        },
        set(target,key,val) {
            // debugger;
            if(origin[key] === val) return true
            target[key] = val
            // TODO: 数组特殊处理
            enqueueWatcherInUpdatePool(state, Array.isArray(target) ? null : key as string)
            if(!pending) {
                pendingUpdate()
                if(queueMicrotask) queueMicrotask(flush)
                else Promise.resolve().then(() => flush())
            }
  
            state.onchange()
            return true
        }
    })

    state.state = proxyState
    return state
}

const beforeCollection = (payload:ICollectionPayload) => {
    collectionSession.push(payload)
}
const endCollection = () => collectionSession.pop()
const beginCollection = (build:Function,collectionPayload:ICollectionPayload) => {
    const resolve = build()
    collectionPayload.resolve = resolve
    return resolve
}

function clearDep(watcher:Function | String,state:State) {
    const stateFlag = state[_symbol.flag] as Symbol
    const getDepMap = (type:string) => {
        let watchDepManage = type === 'cur' ? curWatcherDepManage : oldWatcherDepManage
        return watchDepManage.get(watcher).get(stateFlag)
    } 

    const curDepMap = getDepMap('cur')
    const oldDepMap = getDepMap('old')
    // debugger;
    for(let name in oldDepMap) {
        if(!curDepMap[name]) {
            delete state[_symbol.watchMap][name]
        } 
    }
    oldWatcherDepManage.get(watcher).set(stateFlag,curWatcherDepManage.get(watcher).get(stateFlag))
}

function clearAllDep(watcher:Function | String) {
    let depStates = oldWatcherDepManage.get(watcher)
   
    if(depStates) for(let state of depStates) clearDep(watcher,state[1][_symbol.state] as State)
    else oldWatcherDepManage.set(watcher,curWatcherDepManage.get(watcher))
    
    curWatcherDepManage.set(watcher,null)
}

function pendingUpdate() { pending = true }
function endPendingUpdate() { pending = false }

function enqueueWatcherInUpdatePool(state:State, name?:string) {
    const watchers = state[_symbol.watchMap] as IWatcherMap
    let isRootUpdate = true
    // debugger;
    for(const key in watchers) {
        if(key === name || !name) {
            const keyWatchers = watchers[key]
            keyWatchers.forEach((watcher:IWatcherPayload,id) => {
                setCurrentWaitingUpdateComp(watcher.cacheFunc)
                updateTask.push({task: watcher.observer, id,resolve:watcher.resolve})
                currentTaskPool.add(id)
                isRootUpdate && (isRootUpdate = false)
            })
            watchers[key] = new Map()
        }
    }
}

export const setRealReact = (React:React) => realReact = React
export const collectionDep = (build:Function,state:State | State[],observer ?: Function, cacheFunc ?: Function) => {
    let resolve
    state = linkStateToProxy(state)
    const collectionPayload:ICollectionPayload = {
        build,
        observer:observer ? observer : build,
        resolve,
        cacheFunc
    }
    
    beforeCollection(collectionPayload)
    // debugger;
    const ret = beginCollection(() => build(state),collectionPayload)
    endCollection()
    clearAllDep(makeId(build))
    return ret
}

export const linkStateToProxy = (state: State | State[]) => {
    if(Array.isArray(state)) {
        return state.map(_state => {
            const ret = ReactiveStateProxy(_state)
            return ret
        })
    }
    return ReactiveStateProxy(state as State)
}

export const createRef = <T extends PlainType = PlainType> (val:T):Ref<T> => {
    const state = createState({
        value:val
    })
    return (linkStateToProxy(state) as State).state
}

export const createState = (target:object):State => {
    const state = new State(target)
    if(collectionSession.isCollecting()) {
        const reactivityState = linkStateToProxy(state)
        return realReact.useRef(reactivityState).current
    }
    return state
}

export function exposeDebugVariable() {
    globalThis.depMap = {
        cur: curWatcherDepManage,
        old: oldWatcherDepManage,
    }
}

