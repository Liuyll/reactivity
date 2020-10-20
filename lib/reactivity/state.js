"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const symbol_1 = require("./symbol");
class State {
    constructor(state, options) {
        this._watchMap = {};
        this._flag = Symbol();
        this._onchange = new Set();
        this.state = state;
        this.origin = state;
        if (options === null || options === void 0 ? void 0 : options.onchange)
            this._onchange.add(options.onchange);
        if (options === null || options === void 0 ? void 0 : options.parentState)
            this._parentState = options.parentState;
        for (let key in state) {
            if (typeof state[key] === 'object')
                this.state[key] = new State(state[key], {
                    parentState: this
                });
        }
    }
    convertChangeKey(newState, key, oldValue, newValue) {
        return [newState, oldValue, newValue, key];
    }
    onchange(...argument) {
        this._onchange.forEach(rct => typeof rct === 'function' && rct(...argument));
    }
    addOnChange(rct, key) {
        const _rct = (newState, updateKey, oldValue, newValue) => {
            if (!key || updateKey === key)
                rct(newState, oldValue, newValue);
        };
        this._onchange.add(_rct);
    }
    removeOnChange(rct) {
        this._onchange.delete(rct);
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
