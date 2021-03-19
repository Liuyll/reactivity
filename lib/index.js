"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useReactivityRef = exports.useComputed = exports.useWatcher = exports.useWatchState = exports.createComputed = exports.createWatcher = exports.createWatchState = exports.createRef = exports.registerDom = exports.setRootState = exports.createState = exports.mixInReact = void 0;
const config_1 = require("./config");
const mixInReact_1 = require("./mixInReact/mixInReact");
exports.mixInReact = mixInReact_1.default;
const createState_1 = require("./mixInReact/createState");
Object.defineProperty(exports, "createState", { enumerable: true, get: function () { return createState_1.createState; } });
Object.defineProperty(exports, "setRootState", { enumerable: true, get: function () { return createState_1.setRootState; } });
const dev_1 = require("./dev");
dev_1.default();
function registerDom() {
    config_1.setRegisterDom(true);
}
exports.registerDom = registerDom;
const reactivity_1 = require("./reactivity");
Object.defineProperty(exports, "createRef", { enumerable: true, get: function () { return reactivity_1.createRef; } });
Object.defineProperty(exports, "createWatchState", { enumerable: true, get: function () { return reactivity_1.createWatchState; } });
Object.defineProperty(exports, "createWatcher", { enumerable: true, get: function () { return reactivity_1.createWatcher; } });
Object.defineProperty(exports, "createComputed", { enumerable: true, get: function () { return reactivity_1.createComputed; } });
const useWatchState = reactivity_1.createWatchState, useWatcher = reactivity_1.createWatcher, useComputed = reactivity_1.createComputed, useReactivityRef = reactivity_1.createRef;
exports.useWatchState = useWatchState;
exports.useWatcher = useWatcher;
exports.useComputed = useComputed;
exports.useReactivityRef = useReactivityRef;
