"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exposeDebugVariable = exports.createWatchState = exports.createComputed = exports.createWatcher = exports.createState = exports.createRef = exports.linkStateToProxy = exports.collectionDep = exports.setRealReact = void 0;
const session_1 = require("./session");
const state_1 = require("./state");
const symbol_1 = require("./symbol");
const mixInReact_1 = require("../mixInReact/mixInReact");
const tools_1 = require("../general/tools");
let realReact;
const collectionSession = new session_1.default();
const currentTaskPool = new Set();
const oldWatcherDepManage = new Map();
const curWatcherDepManage = new Map();
const clearTaskPool = () => currentTaskPool.clear();
const addDepToWatcherManage = (id, stateFlag, state, key) => {
    let depManage;
    if ((depManage = curWatcherDepManage.get(id))) {
        let depRepo;
        if ((depRepo = depManage.get(stateFlag)))
            depRepo[key] = true;
        else
            depManage.set(stateFlag, {
                [symbol_1.default.state]: state,
                [key]: true
            });
    }
    else
        curWatcherDepManage.set(id, new Map([
            [stateFlag, {
                    [symbol_1.default.state]: state,
                    [key]: true
                }]
        ]));
};
let transactionId = new Set();
let pending = false;
const startTransaction = () => transactionId.clear();
const endTransaction = startTransaction;
const updateTask = [];
const clearUpdateTask = () => updateTask.length = 0;
const preUpdateTask = [];
const clearPreUpdateTask = () => preUpdateTask.length = 0;
const isPlainObject = (obj) => obj && (typeof obj === 'object');
const flush = () => {
    startTransaction();
    preUpdateTask.forEach(t => t());
    updateTask.forEach(task => {
        const id = task.id;
        const update = task.task;
        const resolve = task.resolve;
        if (!transactionId.has(id)) {
            transactionId.add(id);
            beginCollection(update, { resolve });
        }
    });
    clearUpdateTask();
    clearPreUpdateTask();
    endTransaction();
    endPendingUpdate();
    clearTaskPool();
};
const ReactiveStateProxy = (state) => {
    if (typeof state !== 'object')
        return state;
    if (state.origin !== state.state)
        return state;
    const origin = state.origin;
    const innerState = state.state;
    const stateFlag = state[symbol_1.default.flag];
    let proxyState = new Proxy(origin, {
        get(target, key) {
            if (key === 'origin')
                return origin;
            if (key === symbol_1.default.proxy2state)
                return state;
            const currentSession = collectionSession.peer();
            if (!currentSession)
                return innerState[key] instanceof state_1.default ? innerState[key].state : innerState[key];
            const currentDepWatchMap = state[symbol_1.default.watchMap];
            const watcher = currentSession.cacheFlag;
            const watcherPayload = {
                observer: currentSession.observer,
                resolve: currentSession.resolve,
                build: currentSession.build,
                cacheFlag: currentSession.cacheFlag,
                preObserver: currentSession.preObserver,
                afterObserver: currentSession.afterObserver
            };
            if (!currentDepWatchMap[key])
                currentDepWatchMap[key] = new Map([[watcher, watcherPayload]]);
            else {
                currentDepWatchMap[key].set(watcher, watcherPayload);
            }
            addDepToWatcherManage(watcher, stateFlag, state, key);
            if (isPlainObject(target[key]))
                return (innerState[key] = ReactiveStateProxy(innerState[key])).state;
            return target[key];
        },
        set(target, key, val) {
            if (origin[key] === val)
                return true;
            const oldVal = target[key];
            target[key] = val;
            enqueueWatcherInUpdatePool(state, Array.isArray(target) ? null : key);
            if (!pending) {
                pendingUpdate();
                if (queueMicrotask)
                    queueMicrotask(flush);
                else
                    Promise.resolve().then(() => flush());
            }
            state.onchange(target, key, oldVal, target[key]);
            return true;
        }
    });
    state.state = proxyState;
    return state;
};
const beforeCollection = (payload) => {
    collectionSession.push(payload);
};
const endCollection = () => collectionSession.pop();
const beginCollection = (build, collectionPayload) => {
    const resolve = build();
    collectionPayload.resolve = resolve;
    return resolve;
};
function clearDep(watcher, state) {
    const stateFlag = state[symbol_1.default.flag];
    const getDepMap = (type) => {
        let watchDepManage = type === 'cur' ? curWatcherDepManage : oldWatcherDepManage;
        return watchDepManage.get(watcher).get(stateFlag);
    };
    const curDepMap = getDepMap('cur');
    const oldDepMap = getDepMap('old');
    for (let name in oldDepMap) {
        if (!curDepMap[name]) {
            delete state[symbol_1.default.watchMap][name];
        }
    }
    oldWatcherDepManage.get(watcher).set(stateFlag, curWatcherDepManage.get(watcher).get(stateFlag));
}
function clearAllDep(watcher) {
    let depStates = oldWatcherDepManage.get(watcher);
    if (depStates)
        for (let state of depStates)
            clearDep(watcher, state[1][symbol_1.default.state]);
    else
        oldWatcherDepManage.set(watcher, curWatcherDepManage.get(watcher));
    curWatcherDepManage.set(watcher, null);
}
function pendingUpdate() { pending = true; }
function endPendingUpdate() { pending = false; }
function enqueueWatcherInUpdatePool(state, name) {
    const watchers = state[symbol_1.default.watchMap];
    for (const key in watchers) {
        if (key === name || !name) {
            const keyWatchers = watchers[key];
            keyWatchers.forEach((watcher, id) => {
                mixInReact_1.setCurrentWaitingUpdateComp(watcher.cacheFlag);
                preUpdateTask.push(watcher.preObserver);
                updateTask.push({ task: watcher.observer, id, resolve: watcher.resolve });
                currentTaskPool.add(id);
            });
            watchers[key] = new Map();
        }
    }
}
exports.setRealReact = (React) => realReact = React;
exports.collectionDep = (build, state, observer, cacheFlag, preObserver, afterObserver) => {
    let resolve;
    state = exports.linkStateToProxy(state);
    const collectionPayload = {
        build,
        observer: observer ? observer : build,
        resolve,
        cacheFlag,
        preObserver: preObserver || tools_1.noop,
        afterObserver: afterObserver || tools_1.noop
    };
    beforeCollection(collectionPayload);
    const ret = beginCollection(() => build(state), collectionPayload);
    endCollection();
    clearAllDep(cacheFlag);
    return ret;
};
exports.linkStateToProxy = (state) => {
    if (Array.isArray(state)) {
        return state.map(_state => {
            const ret = ReactiveStateProxy(_state);
            return ret;
        });
    }
    return ReactiveStateProxy(state);
};
exports.createRef = (val, options) => {
    const state = exports.createState({
        value: val
    }, options);
    return exports.linkStateToProxy(state).state;
};
exports.createState = (target, options) => {
    const state = new state_1.default(target, options);
    if (collectionSession.isCollecting()) {
        const reactivityState = exports.linkStateToProxy(state);
        return realReact.useRef(reactivityState).current;
    }
    return state;
};
exports.createWatcher = (target, key, onchange) => {
    if (!(target instanceof state_1.default)) {
        console.error(`call createWacher error: 
    the first argument must be State;
    please call createState fisltly.
    `);
        return;
    }
    const { useEffect } = realReact;
    useEffect(() => {
        target.addOnChange(onchange, key);
        return target.removeOnChange(onchange);
    }, []);
};
exports.createComputed = (computed) => {
    return computed();
};
exports.createWatchState = (target, onchange) => {
    const state = exports.createState(target, { onchange });
    return exports.linkStateToProxy(state).state;
};
function exposeDebugVariable() {
    globalThis.depMap = {
        cur: curWatcherDepManage,
        old: oldWatcherDepManage,
    };
}
exports.exposeDebugVariable = exposeDebugVariable;
