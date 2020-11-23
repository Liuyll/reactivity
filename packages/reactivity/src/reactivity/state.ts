import { IWatcherMap } from './interface'
import _Symbol from './symbol'

export interface IOnChange {
    (newState: object, oldValue ?: any, newValue ?: any, changeKey ?: any): void
}
export interface IStateOptions {
    parentState ?: State,
    onchange ?: Function
}
export default class State {
    private _watchMap : IWatcherMap = {}
    private _flag:Symbol = Symbol()
    private _parentState:State
    private _onchange: Set<Function> = new Set()

    public origin
    public state

    constructor(state,options?:IStateOptions) {
        this.state = state
        this.origin = state
        if(options ?. onchange) this._onchange.add(options.onchange)
        if(options?.parentState) this._parentState = options.parentState

        for(let key in state) {
            if(typeof state[key] === 'object') this.state[key] = new State(state[key],{
                parentState : this
            })
        }
    }

    convertChangeKey(newState:object,key:any,oldValue:any,newValue:any) {
        return [newState,oldValue,newValue,key]
    }

    onchange(...argument: any[]) {
        this._onchange.forEach(rct => typeof rct === 'function' && rct(...argument))
    }

    addOnChange(rct:IOnChange,key ?: any) {
        const _rct = (newState:object,updateKey:any,oldValue:any,newValue:any) => {
            if(!key || updateKey === key) rct(newState,oldValue,newValue)
        }
        this._onchange.add(_rct)
    }

    removeOnChange(rct:Function) {
        this._onchange.delete(rct)
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