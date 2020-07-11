import { rootState } from './createState';
import { useForceUpdate } from './hooks' 
import State from '../reactivity/state'
import { collectionDep } from '../reactivity'

export default function mixInReact(React:any) {
    const createElement = React.createElement
    React.createElement = (h:Function,props:object,children:Function[]) => {
        () => {
            const forceUpdate = useForceUpdate()
            
            let states = [...rootState ? [rootState] : []]
            for(const key in props) {
                const prop = props[key]
                if((prop instanceof State) && !states.includes(prop)) states.push(prop) 
            }

            collectionDep(h,states,forceUpdate)
            return createElement.apply(React,[h,props,children])
        }
    }
}