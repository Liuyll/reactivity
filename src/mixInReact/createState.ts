import { createState as _createState} from './../reactivity/index';
import State from '../reactivity/state'

export let rootState

export function createState(target:object) {
    if(target instanceof State) return target
    return _createState(target)
}

export function setRootState(state:State) {
    if(!(state instanceof State)) return console.warn('setRootState必须传入State类型参数')
    rootState = state
}