"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRootState = exports.createState = exports.rootState = void 0;
const index_1 = require("./../reactivity/index");
const state_1 = require("../reactivity/state");
function createState(target, React) {
    if (target instanceof state_1.default)
        return target;
    return index_1.createState(target);
}
exports.createState = createState;
function setRootState(state) {
    if (!(state instanceof state_1.default))
        return console.warn('setRootState必须传入State类型参数');
    exports.rootState = state;
    if (window.isDev) {
        window.gg = state;
    }
}
exports.setRootState = setRootState;
