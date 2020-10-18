import { isRegisterDom } from './../config';
import { rootState } from './createState';
import { useForceUpdate } from './hooks' 
import State from '../reactivity/state'
import { collectionDep, setRealReact } from '../reactivity'

interface RCTCompType {
    $$typeof: Symbol,
    type: Function
}

function isRCTCompType(comp:Function | string | RCTCompType): comp is RCTCompType {
    return !!(comp as RCTCompType).$$typeof
}
export default function mixInReact(React:any) {
    setRealReact(React)
    const createElement = React.createElement
    React.createElement = (h:Function | string | RCTCompType,props:object,...children:Function[] | String[]) => {
        // 兼容生产情况下,props为null的问题
        if(!props) props = {}
        if(typeof h === 'function') props['rootState'] = rootState

        // let states = [...rootState ? [rootState] : []]
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
        
        return createElement.apply(React,[updateContainer,props,...children])
    }
}
 
function createUpdateContainer(state:State | State[],h:Function | string,React:any) {
    if(typeof h !== 'function') return h
    const build = h
    const { memo } = React
    
    const typeFunc = (props:object,children ?: Array<Function>) => {
        const buildCurry = (curState) => {
            // React.useEffect(() => {
            //     console.log('start')
            //     return () => {
            //         console.log('end')
            //     }
            // },[])

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
        // const v = React.useMemo(() => collectionDep(buildCurry,state,forceUpdate))
        setStringId(buildCurry,h.toString())
        return collectionDep(buildCurry,state,forceUpdate)
    } 
    
    if(isRegisterDom) typeFunc.__rawTypeFn = h.toString()
    return memo ? memo(typeFunc) : typeFunc
}

function setStringId(target:Function,id:string) {
    return target.toString = () => id
}