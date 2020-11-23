import Symbol from './reactivity/symbol'
import { exposeDebugVariable } from './reactivity'

declare module window {
    export let gg
    export let symbol
    export let isDev
}

export default function startDev() {
    window.symbol = Symbol
    window.isDev = true
    exposeDebugVariable()
}
