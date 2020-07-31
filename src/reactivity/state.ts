import { WatcherMap } from './interface'
import _Symbol from './symbol'

interface IStateOptions {
    parentState ?: State,
    onchange ?: Function
}
export default class State {
    private _watchMap : WatcherMap = {}
    private _flag:Symbol = Symbol()
    private _parentState:State
    private _onchange: Function | null

    public origin
    public state


    constructor(state,options?:IStateOptions) {
        this.state = state
        this.origin = state
        this._onchange = options?.onchange
        if(options?.parentState) this._parentState = options.parentState

        for(let key in state) {
            if(typeof state[key] === 'object') this.state[key] = new State(state[key],{
                parentState : this
            })
        }
    }

    onchange() {
        this._onchange && typeof this._onchange === 'function' && this._onchange()
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