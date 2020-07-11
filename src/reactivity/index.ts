import { ICollectionPayload, IUpdateTask, WatcherMap } from './interface';
import Session from './session'
import State from './state'
import _symbol from './symbol'

type WatcherDepManage = Map<Function,Map<Symbol,object>>

const collectionSession = new Session()

const oldWatcherDepManage: WatcherDepManage = new Map()
const curWatcherDepManage: WatcherDepManage = new Map()

let transactionId = []
let pending = false

const startTransaction = () => transactionId.length = 0
const endTransaction = startTransaction

const updateTask:IUpdateTask[] = []


const notify = () => {
    startTransaction()
    
    updateTask.forEach(task => {
        const id = task.id
        clearAllDep(id)

        const update = task.task
        if(!~transactionId.indexOf(id)) {
            transactionId.push(task.id)
            update()
        }
    })

    endTransaction()
    endPendingUpdate()
}

const ReactiveStateProxy = (state:State) => {
    if(typeof state !== 'object') return state
    if(state.origin !== state.state) return 

    const origin = state.origin
    const collectionFlag = state.flag
    
    let proxyState = new Proxy(state,{
        get(target,key){
            if(key === 'origin') return origin

            const currentSession = collectionSession.peer()
            const currentDepWatchMap = state[_symbol.watchMap]

            const watcher = currentSession.build
            const observer = currentSession.observer
            currentDepWatchMap.set(watcher,observer)

            curWatcherDepManage.set(currentSession.build,new Map([
                [collectionFlag,{
                    [_symbol.state]:state,
                    key: true
                }]
            ]))

            return target[key]
        },
        set(target,key,val) {
            target[key] = val
            if(Object.prototype.toString.call(target) === '[object Array]') {}
            else if(typeof target[key] === 'object' && target[key] !== null) {}
            else selectWatcherInUpdatePool(state,key as string)

            if(!pending) {
                pendingUpdate()
                queueMicrotask(notify)
            }

            return true
        }
    })

    state.state = proxyState
    return proxyState
}

const beforeCollection = (payload:ICollectionPayload) => {
    collectionSession.push(payload)
}

const endCollection = () => {
    collectionSession.pop()
}

const beginCollection = (build:Function) => {
    build()
}

function clearDep(watcher:Function,state:State) {
    const stateFlag = state.flag
    const getDepMap = (type:string) => {
        let watchDepManage = type === 'cur' ? curWatcherDepManage : oldWatcherDepManage
        return watchDepManage.get(watcher).get(stateFlag)
    } 

    const curDepMap = getDepMap('cur')
    const oldDepMap = getDepMap('old')
    
    for(let name in curDepMap) {
        if(!oldDepMap[name]) delete state[_symbol.watchMap][watcher]
    }

    oldWatcherDepManage.set(watcher,curWatcherDepManage.get(watcher))
}

function clearAllDep(watcher:Function) {
    let depStates = oldWatcherDepManage.get(watcher)
    for(let state of depStates) clearDep(watcher,state[_symbol.state] as State)
}

function pendingUpdate() {
    pending = true
}

function endPendingUpdate() {
    pending = false
}

function selectWatcherInUpdatePool(state:State,name:string) {
    const watchers = state[_symbol.watchMap] as WatcherMap
    for(const key in watchers) {
        if(key === name) {
            const keyWatchers = watchers[name]
            keyWatchers.forEach((observer,id) => updateTask.push({task:observer,id}))
        }
    }
}

export const collectionDep = (build:Function,state:State | State[],observer ?: Function) => {
    beforeCollection({
        build,
        observer:observer ? observer : build
    })
    if(Array.isArray(state)) {
        for(let _state of state) ReactiveStateProxy(_state)
    }
    else ReactiveStateProxy(state as State)
    beginCollection(build)
    endCollection()
}


export const createState = (target:object) => new State(target)


