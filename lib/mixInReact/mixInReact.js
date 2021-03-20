"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./../config");
const createState_1 = require("./createState");
const hooks_1 = require("./hooks");
const state_1 = require("../reactivity/state");
const reactivity_1 = require("../reactivity");
const tools_1 = require("../general/tools");
function isRCTCompType(comp) {
    return !!comp.$$typeof;
}
const containerMap = new WeakMap();
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
        if (isRCTCompType(h)) {
            h.type = createUpdateContainer(states, h.type, React);
            updateContainer = h;
        }
        else
            updateContainer = createUpdateContainer(states, h, React);
        /**
         * @param h typefunc
         * 更新策略 v1: (checkout old version)
         * 依赖变化时产生的更新，对应组件必须强制更新。但此时父组件不要再走react的逻辑更新依赖性更新的子组件，
         * 由依赖性更新的子组件调用forceupdate自行更新，避免导致多次更新同一组件
         * 不是依赖变化的更新，直接走memo的shallowequal逻辑
         *
         * 更新策略是 v2:
         * 无论如何都要走react的逻辑，否则props无法更新
         * 子组件重复更新问题用version来控制(具体见useVersionForceUpdate的注释)
         */
        if (typeof h !== 'string' && typeof updateContainer !== 'string') {
            if (containerMap.get(h))
                updateContainer = containerMap.get(h);
            else if (React.memo) {
                if (isRCTCompType(updateContainer))
                    updateContainer.type = React.memo(updateContainer.type, tools_1.shallowEqual);
                updateContainer = React.memo(updateContainer, tools_1.shallowEqual);
                containerMap.set(h, updateContainer);
            }
        }
        return createElement.apply(React, [updateContainer, props, ...children]);
    };
}
exports.default = mixInReact;
function createUpdateContainer(state, h, React) {
    if (typeof h !== 'function')
        return h;
    const build = h;
    const typeFunc = (props, children) => {
        const { useRef } = React;
        const cacheFlag = useRef(Symbol());
        const version = useRef(1);
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
        const _forceUpdate = hooks_1.useVersionForceUpdate(React, version);
        const forceUpdate = () => {
            const nextVersion = version.current + 1;
            _forceUpdate(nextVersion);
        };
        setStringId(buildCurry, build.toString());
        return reactivity_1.collectionDep(buildCurry, state, forceUpdate, cacheFlag);
    };
    if (config_1.isRegisterDom)
        typeFunc.__rawTypeFn = h.toString();
    return typeFunc;
}
function setStringId(target, id) {
    return target.toString = () => id;
}
