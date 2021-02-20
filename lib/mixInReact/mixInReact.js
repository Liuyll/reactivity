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
        const { useRef, useLayoutEffect } = React;
        const cacheFlag = useRef(Symbol());
        const updateCache = useRef(false);
        useLayoutEffect(() => {
            deleteCurrentWaitingUpdateComp(cacheFlag);
            if (updateCache.current) {
                updateCache.current = false;
                forceUpdate();
            }
        });
        const buildCurry = (curState) => {
            let i = 0;
            const newProps = {};
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
            shouldUpdate.cb = () => {
                if (!updateCache.current)
                    updateCache.current = true;
                return !exports.currentWaitingUpdateComp.get(cacheFlag);
            };
        return reactivity_1.collectionDep(buildCurry, state, forceUpdate, cacheFlag);
    };
    if (config_1.isRegisterDom)
        typeFunc.__rawTypeFn = h.toString();
    return typeFunc;
}
function setStringId(target, id) {
    return target.toString = () => id;
}
