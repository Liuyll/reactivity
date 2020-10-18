import { ICollectionPayload, IUpdateTask, IWatcherMap, IWatcherPayload, WatcherDepManage, PlainType, Ref } from './interface';
import Session from './session'
import State from './state'
import _symbol from './symbol'
import React = require('react')

let realReact:React
const collectionSession = new Session()
const currentTaskPool = new Set()
const oldWatcherDepManage: WatcherDepManage = new Map()
const curWatcherDepManage: WatcherDepManage = new Map()

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

            const currentDepWatchMap = state[_symbol.watchMap] as IWatcherMap
            const watcher = makeId(currentSession.build)
            const watcherPayload:IWatcherPayload = {observer:currentSession.observer,resolve:currentSession.resolve}
            if(!currentDepWatchMap[key]) currentDepWatchMap[key] = new Map<Function | String,IWatcherPayload>([[watcher,watcherPayload]])
            else currentDepWatchMap[key].set(watcher,watcherPayload)

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
            // debugger;
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
    for(const key in watchers) {
        if(key === name || !name) {
            const keyWatchers = watchers[key]
            keyWatchers.forEach((watcher:IWatcherPayload,id) => {
                updateTask.push({task: isRootUpdate ? watcher.observer : noop, id,resolve:watcher.resolve})
                currentTaskPool.add(id)
                isRootUpdate && (isRootUpdate = false)
            })
        }
    }
}

export const setRealReact = (React:React) => realReact = React
export const collectionDep = (build:Function,state:State | State[],observer ?: Function) => {
    let resolve
    state = linkStateToProxy(state)
    const collectionPayload = {
        build,
        observer:observer ? observer : build,
        resolve
    }
    
    beforeCollection(collectionPayload)
    // @depreacated 
    // 与linkStateToProxy重复
    // if(Array.isArray(state)) for(let _state of state) ReactiveStateProxy(_state) 
    // else ReactiveStateProxy(state as State)

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


