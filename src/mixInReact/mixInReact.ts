import { rootState } from './createState';
import { useForceUpdate } from './hooks' 
import State from '../reactivity/state'
import { collectionDep,linkStateToProxy } from '../reactivity'

export default function mixInReact(React:any) {
    const createElement = React.createElement
    React.createElement = (h:Function | String,props:object,...children:Function[] | String[]) => {
        if(typeof h === 'function') props['rootState'] = rootState

        // let states = [...rootState ? [rootState] : []]
        const states = []
        for(const key in props) {
            const prop = props[key]
            if((prop instanceof State) && !states.includes(prop)) {
                states.push(prop) 
            }
        }

        const updateContainer = createUpdateContainer(states,h,React)
        return createElement.apply(React,[updateContainer,props,...children])
    }
}
 
function createUpdateContainer(state:State | State[],h:Function | String,React:any) {
    if(typeof h !== 'function') return h
    const build = h
    
    const typeFunc = (props:object,children ?: Array<Function>) => {
        const buildCurry = (curState) => {
            let i = 0
            const newProps = {}
            for(let key in props) if(props[key] instanceof State) newProps[key] = curState[i++].state
            props = newProps

            return build.apply(null,[props,children])
        }

        const forceUpdate = useForceUpdate(React)
        // const v = React.useMemo(() => collectionDep(buildCurry,state,forceUpdate))
        setStringId(buildCurry,h.toString())
        return collectionDep(buildCurry,state,forceUpdate)
    }   

    return typeFunc
}

function setStringId(target:Function,id:string) {
    return target.toString = () => id
}