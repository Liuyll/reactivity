import { isRegisterDom } from './../config';
import { rootState } from './createState';
import { useForceUpdate } from './hooks' 
import State from '../reactivity/state'
import { collectionDep, setRealReact } from '../reactivity'
import { shallowEqual } from '../dom/tools'

interface RCTCompType {
    $$typeof: Symbol,
    type: Function
}

function isRCTCompType(comp:Function | string | RCTCompType): comp is RCTCompType {
    return !!(comp as RCTCompType).$$typeof
}

export const currentWaitingUpdateComp:Map<Function,boolean> = new Map()
const containerMap = new WeakMap()

export function setCurrentWaitingUpdateComp(h:Function) {
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
        if(isRCTCompType(h)) {
            h.type = createUpdateContainer(states,(h as RCTCompType).type,React)
            updateContainer = h
        } else updateContainer = createUpdateContainer(states,h as (Function | string),React)
        
        /**
         * @param h typefunc
         * 更新策略是:
         * 依赖性更新，对应组件必须强制更新。但此时父组件不要再走react的逻辑更新依赖性更新的子组件，
         * 由依赖性更新的子组件调用forceupdate自行更新，避免导致多次更新同一组件
         */
        const ignoreRedundancyUpdate = (h:Function) => {
            return () => {
                if(currentWaitingUpdateComp.get(h)) return true
                return shallowEqual
            } 
        }

        if(typeof h !== 'string' && typeof updateContainer !== 'string') {
            if(containerMap.get(h)) updateContainer = containerMap.get(h)
            else if(React.memo) {
                const rawUpdateContainer:Function = isRCTCompType(updateContainer) ? updateContainer.type : updateContainer
                if(isRCTCompType(updateContainer)) updateContainer.type = React.memo(updateContainer.type,ignoreRedundancyUpdate(rawUpdateContainer)) 
                updateContainer = React.memo(updateContainer,ignoreRedundancyUpdate(rawUpdateContainer))
                containerMap.set(h,updateContainer)
            }
        }
        
        return createElement.apply(React,[updateContainer,props,...children])
    }
}
 
function createUpdateContainer<T=Function | string>(state:State | State[],h:T,React:any):T {
    if(typeof h !== 'function') return h
    const build = h
    
    const typeFunc = (props:object,children ?: Array<Function>) => {
        // console.log('update:',h)
        const buildCurry = (curState) => {
            // React.useEffect(() => {},[])

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
        setStringId(buildCurry,h.toString())
        return collectionDep(buildCurry,state,forceUpdate,typeFunc)
    } 
    
    if(isRegisterDom) typeFunc.__rawTypeFn = h.toString()
    return typeFunc as any
}

function setStringId(target:Function,id:string) {
    return target.toString = () => id
}