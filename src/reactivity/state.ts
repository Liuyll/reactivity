import { WatcherMap } from './interface'
import _Symbol from './symbol'

export default class State {
    private _watchMap : WatcherMap = {}
    private _flag:Symbol = Symbol()
    private _parentState:State

    public origin
    public state

    constructor(state,parentState ?: State) {
        this.state = state
        this.origin = state
        if(parentState) this._parentState = parentState

        for(let key in state) {
            if(typeof state[key] === 'object') this.state[key] = new State(state[key],this)
        }
    }

    get [_Symbol.flag]() {
        return this._flag
    }

    get [_Symbol.watchMap]() {
        return this._watchMap
    }

    get [_Symbol.parentState]() {
        return this._parentState
    }
}