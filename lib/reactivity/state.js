"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const symbol_1 = require("./symbol");
class State {
    constructor(state, options) {
        this._watchMap = {};
        this._flag = Symbol();
        this.state = state;
        this.origin = state;
        this._onchange = options === null || options === void 0 ? void 0 : options.onchange;
        if (options === null || options === void 0 ? void 0 : options.parentState)
            this._parentState = options.parentState;
        for (let key in state) {
            if (typeof state[key] === 'object')
                this.state[key] = new State(state[key], {
                    parentState: this
                });
        }
    }
    onchange() {
        this._onchange && typeof this._onchange === 'function' && this._onchange();
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
