import { setRegisterDom } from './config'
import mixInReact from './mixInReact/mixInReact'
import { createState,setRootState } from './mixInReact/createState'
import startDev from './dev'

startDev()

function registerDom() {
    setRegisterDom(true)
}

import {
    createRef,
    createWatchState,
    createWatcher,
    createComputed, 
} from './reactivity'

const useWatchState = createWatchState,
    useWatcher = createWatcher,
    useComputed = createComputed,
    useReactivityRef = createRef

export {
    mixInReact,
    createState,
    setRootState,
    registerDom,
    createRef,
    createWatchState,
    createWatcher,
    createComputed, 
    useWatchState,
    useWatcher,
    useComputed,
    useReactivityRef
}

export * from './dom'