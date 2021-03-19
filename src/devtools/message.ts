import { convertMutationValueToStr } from './utils'
import { IMutationMessage, IStore } from './interface'

const makeMutationMessage = (message: IMutationMessage): string => {
    message.type = 'mutation'
    return convertMutationValueToStr(message) as string
}

const sendMessage = (message: string) => {
    const eventDom = document.getElementById('__reactivity_devtools_')
    if(!eventDom) {
        throw 'no communicate DOM!'
    } 
    const event = new CustomEvent('message', {
        detail: message
    })
    eventDom.dispatchEvent(event)
}

const notifyMutationToDevtools = (message: IMutationMessage) => {
    const messageStr = makeMutationMessage(message)
    sendMessage(messageStr)
}

const getStoreAndPath = (prevPath: string[], key: string) => {
    const store = prevPath[0]
    const path = prevPath.slice(1).concat(key).join('.')
    return [store, path]
}

const sendStoreToDevTools = (store: IStore) => {
    store.type = 'store'
    const storeStr = convertMutationValueToStr(store) as string
    sendMessage(storeStr)
}

const clearStoreToDevtools = (store: string) => {
    const message = {}
    message['type'] = 'clearStore'
    message['name'] = store
    sendMessage(JSON.stringify(message))
}

export {
    notifyMutationToDevtools,
    getStoreAndPath,
    sendStoreToDevTools,
    clearStoreToDevtools
}