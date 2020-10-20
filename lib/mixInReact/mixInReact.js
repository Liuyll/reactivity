"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCurrentWaitingUpdateComp = exports.setCurrentWaitingUpdateComp = exports.deleteCurrentWaitingUpdateComp = exports.currentWaitingUpdateComp = void 0;
const config_1 = require("./../config");
const createState_1 = require("./createState");
const hooks_1 = require("./hooks");
const state_1 = require("../reactivity/state");
const reactivity_1 = require("../reactivity");
const tools_1 = require("../general/tools");
function isRCTCompType(comp) {
    return !!comp.$$typeof;
}
exports.currentWaitingUpdateComp = new Map();
const containerMap = new WeakMap();
function deleteCurrentWaitingUpdateComp(h) {
    exports.currentWaitingUpdateComp.set(h, false);
}
exports.deleteCurrentWaitingUpdateComp = deleteCurrentWaitingUpdateComp;
function setCurrentWaitingUpdateComp(h) {
    exports.currentWaitingUpdateComp.set(h, true);
}
exports.setCurrentWaitingUpdateComp = setCurrentWaitingUpdateComp;
function clearCurrentWaitingUpdateComp() {
    exports.currentWaitingUpdateComp.clear();
}
exports.clearCurrentWaitingUpdateComp = clearCurrentWaitingUpdateComp;
function mixInReact(React) {
    reactivity_1.setRealReact(React);
    const createElement = React.createElement;
    React.createElement = (h, props, ...children) => {
        // 兼容生产情况下,props为null的问题
        if (!props)
            props = {};
        if (typeof h === 'function')
            props['rootState'] = createState_1.rootState;
        const states = [];
        for (const key in props) {
            const prop = props[key];
            if ((prop instanceof state_1.default) && !states.includes(prop)) {
                states.push(prop);
            }
        }
        let updateContainer;
        const shouldUpdate = {
            cb: null
        };
        if (isRCTCompType(h)) {
            h.type = createUpdateContainer(states, h.type, React, shouldUpdate);
            updateContainer = h;
        }
        else
            updateContainer = createUpdateContainer(states, h, React, shouldUpdate);
        /**
         * @param h typefunc
         * 更新策略是:
         * 依赖变化时产生的更新，对应组件必须强制更新。但此时父组件不要再走react的逻辑更新依赖性更新的子组件，
         * 由依赖性更新的子组件调用forceupdate自行更新，避免导致多次更新同一组件
         * 不是依赖变化的更新，直接走memo的shallowequal逻辑
         */
        const ignoreRedundancyUpdate = () => {
            return () => {
                if (!shouldUpdate.cb || shouldUpdate.cb())
                    return tools_1.shallowEqual;
                else if (!shouldUpdate.cb())
                    return true;
            };
        };
        if (typeof h !== 'string' && typeof updateContainer !== 'string') {
            if (containerMap.get(h))
                updateContainer = containerMap.get(h);
            else if (React.memo) {
                if (isRCTCompType(updateContainer))
                    updateContainer.type = React.memo(updateContainer.type, ignoreRedundancyUpdate());
                updateContainer = React.memo(updateContainer, ignoreRedundancyUpdate());
                containerMap.set(h, updateContainer);
            }
        }
        return createElement.apply(React, [updateContainer, props, ...children]);
    };
}
exports.default = mixInReact;
function createUpdateContainer(state, h, React, shouldUpdate) {
    if (typeof h !== 'function')
        return h;
    const build = h;
    const typeFunc = (props, children) => {
        const { useRef, useEffect } = React;
        const cacheFlag = useRef(Symbol());
        useEffect(() => {
            deleteCurrentWaitingUpdateComp(cacheFlag);
        });
        const buildCurry = (curState) => {
            let i = 0;
            const newProps = {};
            // 将props的State直接代理到state
            for (let key in props)
                if (props[key] instanceof state_1.default)
                    newProps[key] = curState[i++].state;
                else
                    newProps[key] = props[key];
            props = newProps;
            return build.apply(null, [props, children]);
        };
        const forceUpdate = hooks_1.useForceUpdate(React);
        setStringId(buildCurry, build.toString());
        if (shouldUpdate)
            shouldUpdate.cb = () => !exports.currentWaitingUpdateComp.get(cacheFlag);
        return reactivity_1.collectionDep(buildCurry, state, forceUpdate, cacheFlag);
    };
    if (config_1.isRegisterDom)
        typeFunc.__rawTypeFn = h.toString();
    return typeFunc;
}
function setStringId(target, id) {
    return target.toString = () => id;
}
