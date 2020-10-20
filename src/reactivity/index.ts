import { ICollectionPayload, IUpdateTask, IWatcherMap, IWatcherPayload, WatcherDepManage, PlainType, Ref } from './interface';
import Session from './session'
import State, { IOnChange, IStateOptions } from './state'
import _symbol from './symbol'
import { setCurrentWaitingUpdateComp } from '../mixInReact/mixInReact'
import { noop } from '../general/tools'

let realReact: any
const collectionSession = new Session()
const currentTaskPool = new Set()
const oldWatcherDepManage: WatcherDepManage = new Map()
const curWatcherDepManage: WatcherDepManage = new Map()

const clearTaskPool = () => currentTaskPool.clear()
const addDepToWatcherManage = (id: Symbol, stateFlag:Symbol,state:State,key) => {
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

let transactionId:Set<Symbol> = new Set()
let pending = false
const startTransaction = () => transactionId.clear()
const endTransaction = startTransaction
const updateTask:IUpdateTask[] = []
const clearUpdateTask = () => updateTask.length = 0
const preUpdateTask: Function[] = []
const clearPreUpdateTask = () => preUpdateTask.length = 0
const isPlainObject = (obj:any) => obj && (typeof obj === 'object')

const flush = () => {
    startTransaction()
    
    preUpdateTask.forEach(t => t())
    updateTask.forEach(task => {
        const id = task.id
        const update = task.task
        const resolve = task.resolve

        if(!transactionId.has(id)) {
            transactionId.add(id)
            beginCollection(update,{resolve} as ICollectionPayload)
        }
    })
    clearUpdateTask()
    clearPreUpdateTask()

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
            const watcher = currentSession.cacheFlag
            const watcherPayload:IWatcherPayload = {
                observer:currentSession.observer,
                resolve:currentSession.resolve,
                build:currentSession.build,
                cacheFlag:currentSession.cacheFlag,
                preObserver:currentSession.preObserver,
                afterObserver: currentSession.afterObserver
            }
            if(!currentDepWatchMap[key]) currentDepWatchMap[key] = new Map<Symbol,IWatcherPayload>([[watcher,watcherPayload]])
            else {
                currentDepWatchMap[key].set(watcher,watcherPayload)
            }

            addDepToWatcherManage(watcher,stateFlag,state,key)
            if(isPlainObject(target[key])) return (innerState[key] = ReactiveStateProxy(innerState[key])).state

            return target[key]
        },
        set(target,key,val) {
            if(origin[key] === val) return true
            const oldVal = target[key]
            target[key] = val
            enqueueWatcherInUpdatePool(state, Array.isArray(target) ? null : key as string)
            if(!pending) {
                pendingUpdate()
                if(queueMicrotask) queueMicrotask(flush)
                else Promise.resolve().then(() => flush())
            }
            
            state.onchange(target,key,oldVal,target[key])
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

function clearDep(watcher:Symbol,state:State) {
    const stateFlag = state[_symbol.flag] as Symbol
    const getDepMap = (type:string) => {
        let watchDepManage = type === 'cur' ? curWatcherDepManage : oldWatcherDepManage
        return watchDepManage.get(watcher).get(stateFlag)
    } 

    const curDepMap = getDepMap('cur')
    const oldDepMap = getDepMap('old')
    for(let name in oldDepMap) {
        if(!curDepMap[name]) {
            delete state[_symbol.watchMap][name]
        } 
    }
    oldWatcherDepManage.get(watcher).set(stateFlag,curWatcherDepManage.get(watcher).get(stateFlag))
}

function clearAllDep(watcher:Symbol) {
    let depStates = oldWatcherDepManage.get(watcher)
    if(depStates) for(let state of depStates) clearDep(watcher,state[1][_symbol.state] as State)
    else oldWatcherDepManage.set(watcher,curWatcherDepManage.get(watcher))
    curWatcherDepManage.set(watcher,null)
}

function pendingUpdate() { pending = true }
function endPendingUpdate() { pending = false }

function enqueueWatcherInUpdatePool(state:State, name?:string) {
    const watchers = state[_symbol.watchMap] as IWatcherMap
    for(const key in watchers) {
        if(key === name || !name) {
            const keyWatchers = watchers[key]
            keyWatchers.forEach((watcher:IWatcherPayload,id: Symbol) => {
                setCurrentWaitingUpdateComp(watcher.cacheFlag)
                preUpdateTask.push(watcher.preObserver)
                updateTask.push({task: watcher.observer, id,resolve:watcher.resolve})
                currentTaskPool.add(id)
            })
            watchers[key] = new Map()
        }
    }
}

export const setRealReact = (React) => realReact = React
export const collectionDep = (build:Function,state:State | State[],observer ?: Function, cacheFlag ?: Symbol, preObserver ?: Function, afterObserver ?: Function) => {
    let resolve
    state = linkStateToProxy(state)
    const collectionPayload:ICollectionPayload = {
        build,
        observer:observer ? observer : build,
        resolve,
        cacheFlag,
        preObserver: preObserver || noop,
        afterObserver: afterObserver || noop
    }
    
    beforeCollection(collectionPayload)
    const ret = beginCollection(() => build(state),collectionPayload)
    endCollection()
    clearAllDep(cacheFlag)
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

export const createRef = <T extends PlainType = PlainType> (val:T,options ?: IStateOptions):Ref<T> => {
    const state = createState({
        value:val
    },options)
    return (linkStateToProxy(state) as State).state
}

export const createState = (target:object, options ?: IStateOptions):State => {
    const state = new State(target,options)
    if(collectionSession.isCollecting()) {
        const reactivityState = linkStateToProxy(state)
        return realReact.useRef(reactivityState).current
    }
    return state
}

export const createWatcher = (target:State,key:any,onchange:IOnChange):void => {
    if(!(target instanceof State)) {
        console.error(
    `call createWacher error: 
    the first argument must be State;
    please call createState fisltly.
    `)
        return 
    }
    const { useEffect } = realReact
    useEffect(() => {
        target.addOnChange(onchange,key)
        return target.removeOnChange(onchange)
    },[])
}

export const createComputed = (computed:Function) => {
    return computed()
}

export const createWatchState = (target:object,onchange:Function):any => {
    const state = createState(target, { onchange })
    return (linkStateToProxy(state) as State).state
}

export function exposeDebugVariable() {
    globalThis.depMap = {
        cur: curWatcherDepManage,
        old: oldWatcherDepManage,
    }
}

