"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const symbol_1 = require("./symbol");
class State {
    constructor(state, parentState) {
        this._watchMap = {};
        this._flag = Symbol();
        this.state = state;
        this.origin = state;
        if (parentState)
            this._parentState = parentState;
        for (let key in state) {
            if (typeof state[key] === 'object')
                this.state[key] = new State(state[key], this);
        }
    }
    get [symbol_1.default.flag]() {
        return this._flag;
    }
    get [symbol_1.default.watchMap]() {
        return this._watchMap;
    }
    get [symbol_1.default.parentState]() {
        return this._parentState;
    }
}
exports.default = State;
