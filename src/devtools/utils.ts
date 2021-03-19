import State from "../reactivity/state"
import { MutationMessageValue } from "./interface"

const convertUnnormalMutationMessageReplacer = (map) => function(k, v) {
    if(map.get(this)) {
        let flag = false
        for(let v of map) {
            if(v[1] == this) flag = true
            if(flag) map.delete[v[0]]
        }
    }
    
    map.set(this, true)
    if(map.get(v)) return '<Circular>'
    if(typeof v === 'function') return 'Function'
    if(typeof v === 'symbol') return 'Symbol'
    return v instanceof State ? v.origin : v
}

const convertMutationValueToStr = (value: MutationMessageValue): string | number => {
    let ret: string | number
    if(value && typeof value === 'object') {
        ret = JSON.stringify(value, convertUnnormalMutationMessageReplacer(new Map()))
    } else if(typeof value === 'symbol') {
        ret = 'Symbol'
    } else if(typeof value === 'function') {
        ret = 'Function'
    } else {
        ret = value as (string | number)
    }

    return ret
}

export {
    convertUnnormalMutationMessageReplacer,
    convertMutationValueToStr
}