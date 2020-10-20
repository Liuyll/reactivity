"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const symbol_1 = require("./reactivity/symbol");
const reactivity_1 = require("./reactivity");
function startDev() {
    window.symbol = symbol_1.default;
    window.isDev = true;
    reactivity_1.exposeDebugVariable();
}
exports.default = startDev;
