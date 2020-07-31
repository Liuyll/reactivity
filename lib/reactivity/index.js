"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createState = exports.linkStateToProxy = exports.collectionDep = void 0;
const session_1 = require("./session");
const state_1 = require("./state");
const symbol_1 = require("./symbol");
const collectionSession = new session_1.default();
const oldWatcherDepManage = new Map();
const curWatcherDepManage = new Map();
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
const makeId = (type) => type.toString();
const createDepManage = (id, payload) => new Map([[id, payload]]);
let transactionId = [];
let pending = false;
const startTransaction = () => transactionId.length = 0;
const endTransaction = startTransaction;
const updateTask = [];
const isPlainObject = (obj) => obj && (typeof obj === 'object');
const notify = () => {
    startTransaction();
    updateTask.forEach(task => {
        const id = task.id;
        // clearAllDep(id)
        const update = task.task;
        const resolve = task.resolve;
        if (!~transactionId.indexOf(id)) {
            transactionId.push(task.id);
            beginCollection(update, { resolve });
        }
    });
    endTransaction();
    endPendingUpdate();
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
            // debugger;
            const currentSession = collectionSession.peer();
            if (!currentSession)
                return innerState[key] instanceof state_1.default ? innerState[key].state : innerState[key];
            const currentDepWatchMap = state[symbol_1.default.watchMap];
            const watcher = makeId(currentSession.build);
            const watcherPayload = { observer: currentSession.observer, resolve: currentSession.resolve };
            if (!currentDepWatchMap[key])
                currentDepWatchMap[key] = new Map([[watcher, watcherPayload]]);
            else
                currentDepWatchMap[key].set(watcher, watcherPayload);
            addDepToWatcherManage(watcher, stateFlag, state, key);
            if (isPlainObject(target[key]))
                return (innerState[key] = ReactiveStateProxy(innerState[key])).state;
            return target[key];
        },
        set(target, key, val) {
            // console.log(key,val)
            if (origin[key] === val)
                return true;
            target[key] = val;
            // TODO: 数组特殊处理
            selectWatcherInUpdatePool(state, Array.isArray(target) ? null : key);
            if (!pending) {
                pendingUpdate();
                queueMicrotask(notify);
            }
            state.onchange();
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
    // debugger;
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
function pendingUpdate() {
    pending = true;
}
function endPendingUpdate() {
    pending = false;
}
function selectWatcherInUpdatePool(state, name) {
    const watchers = state[symbol_1.default.watchMap];
    for (const key in watchers) {
        if (key === name || !name) {
            const keyWatchers = watchers[key];
            keyWatchers.forEach((watcher, id) => updateTask.push({ task: watcher.observer, id, resolve: watcher.resolve }));
        }
    }
}
exports.collectionDep = (build, state, observer) => {
    let resolve;
    state = exports.linkStateToProxy(state);
    const collectionPayload = {
        build,
        observer: observer ? observer : build,
        resolve
    };
    beforeCollection(collectionPayload);
    if (Array.isArray(state))
        for (let _state of state)
            ReactiveStateProxy(_state);
    else
        ReactiveStateProxy(state);
    // debugger;
    const ret = beginCollection(() => build(state), collectionPayload);
    endCollection();
    clearAllDep(makeId(build));
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
exports.createState = (target) => new state_1.default(target);
