"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./../config");
const createState_1 = require("./createState");
const hooks_1 = require("./hooks");
const state_1 = require("../reactivity/state");
const reactivity_1 = require("../reactivity");
function mixInReact(React) {
    const createElement = React.createElement;
    React.createElement = (h, props, ...children) => {
        if (typeof h === 'function')
            props['rootState'] = createState_1.rootState;
        // let states = [...rootState ? [rootState] : []]
        const states = [];
        for (const key in props) {
            const prop = props[key];
            if ((prop instanceof state_1.default) && !states.includes(prop)) {
                states.push(prop);
            }
        }
        const updateContainer = createUpdateContainer(states, h, React);
        return createElement.apply(React, [updateContainer, props, ...children]);
    };
}
exports.default = mixInReact;
function createUpdateContainer(state, h, React) {
    if (typeof h !== 'function')
        return h;
    const build = h;
    const { memo } = React;
    const typeFunc = (props, children) => {
        const buildCurry = (curState) => {
            let i = 0;
            const newProps = {};
            for (let key in props)
                if (props[key] instanceof state_1.default)
                    newProps[key] = curState[i++].state;
            props = newProps;
            return build.apply(null, [props, children]);
        };
        const forceUpdate = hooks_1.useForceUpdate(React);
        // const v = React.useMemo(() => collectionDep(buildCurry,state,forceUpdate))
        setStringId(buildCurry, h.toString());
        return reactivity_1.collectionDep(buildCurry, state, forceUpdate);
    };
    if (config_1.isRegisterDom)
        typeFunc.__rawTypeFn = h.toString();
    return memo ? memo(typeFunc) : typeFunc;
}
function setStringId(target, id) {
    return target.toString = () => id;
}
