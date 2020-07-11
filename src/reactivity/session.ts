import { ICollectionPayload } from './interface';

interface ISession {
    stack: ICollectionPayload[]
    push:(payload:ICollectionPayload) => null
    pop:() => ICollectionPayload
    peer:() => ICollectionPayload
}

export default class Session implements ISession {
    stack:ICollectionPayload[]
    constructor() {
        this.stack = []
    }

    push(payload:ICollectionPayload) {
        this.stack.push(payload)
        return null
    }

    pop() {
        return this.stack.pop()
    }

    peer() {
        return this.stack[this.stack.length - 1]
    }
}