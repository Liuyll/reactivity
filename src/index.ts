import { setRegisterDom } from './config';
import mixInReact from './mixInReact/mixInReact'
import { createState,setRootState } from './mixInReact/createState'
import startDev from './dev'

startDev()

function registerDom() {
    setRegisterDom(true)
}

export { 
    createRef,
    createWatchState,
    createWatcher,
    createComputed 
} from './reactivity'

export {
    mixInReact,
    createState,
    setRootState,
    registerDom
}

export * from './dom'