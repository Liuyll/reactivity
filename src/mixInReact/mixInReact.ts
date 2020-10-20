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
        const { useRef, useEffect } = React
        const cacheFlag = useRef(Symbol())
        useEffect(() => {
            deleteCurrentWaitingUpdateComp(cacheFlag)
        })

        const buildCurry = (curState) => {
            let i = 0
            const newProps = {}
            for(let key in props) 
                if(props[key] instanceof State) newProps[key] = curState[i++].state
                else newProps[key] = props[key]
            props = newProps
            return build.apply(null,[props,children])
        }

        const forceUpdate = useForceUpdate(React)
        setStringId(buildCurry,build.toString())
        if(shouldUpdate) shouldUpdate.cb = () => !currentWaitingUpdateComp.get(cacheFlag)
        return collectionDep(buildCurry,state,forceUpdate,cacheFlag)
    } 
    
    if(isRegisterDom) typeFunc.__rawTypeFn = h.toString()
    return typeFunc as any
}

function setStringId(target:Function,id:string) {
    return target.toString = () => id
}