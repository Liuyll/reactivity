import { WatcherMap } from './interface'
import _Symbol from './symbol'

export default class State {
    private watchMap : WatcherMap = {}
    private _flag:Symbol = _Symbol.flag

    public origin
    public state

    constructor(state) {
        this.state = state
        this.origin = state
    }

    get flag() {
        return this._flag
    }

    get [_Symbol.watchMap]() {
        return this.watchMap
    }
}