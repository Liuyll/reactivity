"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDom = exports.setRootState = exports.createState = exports.mixInReact = exports.createComputed = exports.createWatcher = exports.createWatchState = exports.createRef = void 0;
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
var reactivity_1 = require("./reactivity");
Object.defineProperty(exports, "createRef", { enumerable: true, get: function () { return reactivity_1.createRef; } });
Object.defineProperty(exports, "createWatchState", { enumerable: true, get: function () { return reactivity_1.createWatchState; } });
Object.defineProperty(exports, "createWatcher", { enumerable: true, get: function () { return reactivity_1.createWatcher; } });
Object.defineProperty(exports, "createComputed", { enumerable: true, get: function () { return reactivity_1.createComputed; } });
__exportStar(require("./dom"), exports);
