import { isRegisterDom } from './../config';
import { rootState } from './createState';
import { useForceUpdate } from './hooks' 
import State from '../reactivity/state'
import { collectionDep, setRealReact } from '../reactivity'
import { shallowEqual } from '../general/tools'

interface RCTCompType {
    $$typeof: Symbol,
    type: Function
}

function isRCTCompType(comp:Function | string | RCTCompType): comp is RCTCompType {
    return !!(comp as RCTCompType).$$typeof
}

export const currentWaitingUpdateComp:Map<Symbol,boolean> = new Map()
const containerMap = new WeakMap()

export function deleteCurrentWaitingUpdateComp(h: Symbol) {
    currentWaitingUpdateComp.set(h,false)
}
export function setCurrentWaitingUpdateComp(h:Symbol) {
    currentWaitingUpdateComp.set(h,true)
}

export function clearCurrentWaitingUpdateComp() {
    currentWaitingUpdateComp.clear()
}

export default function mixInReact(React:any) {
    setRealReact(React)
    const createElement = React.createElement
    React.createElement = (h:Function | string | RCTCompType,props:object,...children:Function[] | String[]) => {
        // 兼容生产情况下,props为null的问题
        if(!props) props = {}
        if(typeof h === 'function') props['rootState'] = rootState

        const states = []
        for(const key in props) {
            const prop = props[key]
            if((prop instanceof State) && !states.includes(prop)) {
                states.push(prop) 
            }
        }

        let updateContainer:RCTCompType | Function | string
        const shouldUpdate = {
            cb: null
        }
        if(isRCTCompType(h)) {
            h.type = createUpdateContainer(states,(h as RCTCompType).type,React,shouldUpdate)
            updateContainer = h
        } else updateContainer = createUpdateContainer(states,h as (Function | string),React,shouldUpdate)
        
        /**
         * @param h typefunc
         * 更新策略是:
         * 依赖变化时产生的更新，对应组件必须强制更新。但此时父组件不要再走react的逻辑更新依赖性更新的子组件，
         * 由依赖性更新的子组件调用forceupdate自行更新，避免导致多次更新同一组件
         * 不是依赖变化的更新，直接走memo的shallowequal逻辑
         */
        const ignoreRedundancyUpdate = () => {
            return () => {
                if(!shouldUpdate.cb || shouldUpdate.cb()) return shallowEqual
                else if(!shouldUpdate.cb()) return true
            } 
        }

        if(typeof h !== 'string' && typeof updateContainer !== 'string') {
            if(containerMap.get(h)) updateContainer = containerMap.get(h)
            else if(React.memo) {
                if(isRCTCompType(updateContainer)) updateContainer.type = React.memo(updateContainer.type,ignoreRedundancyUpdate()) 
                updateContainer = React.memo(updateContainer,ignoreRedundancyUpdate())
                containerMap.set(h,updateContainer)
            }
        }
        
        return createElement.apply(React,[updateContainer,props,...children])
    }
}
 
function createUpdateContainer<T=Function | string>(state:State | State[],h:T,React:any,shouldUpdate ?: any):T {
    if(typeof h !== 'function') return h
    const build = h

    const typeFunc = (props:object,children ?: Array<Function>) => {
        const { useRef, useEffect, useLayoutEffect } = React
        const cacheFlag = useRef(Symbol())
        const updateCache = useRef(false)
        // 避免effect延迟
        useLayoutEffect(() => {
            deleteCurrentWaitingUpdateComp(cacheFlag)
            if(updateCache.current) {
                updateCache.current = false
                forceUpdate()
            }
        })

        const buildCurry = (curState) => {
            let i = 0
            const newProps = {}
            // 将props的State直接代理到state
            for(let key in props) 
                if(props[key] instanceof State) newProps[key] = curState[i++].state
                else newProps[key] = props[key]
            props = newProps
            return build.apply(null,[props,children])
        }

        const forceUpdate = useForceUpdate(React)
        setStringId(buildCurry,build.toString())
        if(shouldUpdate) shouldUpdate.cb = () => {
            // 标志延迟更新
            if(!updateCache.current) updateCache.current = true
            return !currentWaitingUpdateComp.get(cacheFlag)
        }
        return collectionDep(buildCurry,state,forceUpdate,cacheFlag)
    } 
    
    if(isRegisterDom) typeFunc.__rawTypeFn = h.toString()
    return typeFunc as any
}

function setStringId(target:Function,id:string) {
    return target.toString = () => id
}