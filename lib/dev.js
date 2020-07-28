"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const symbol_1 = require("./reactivity/symbol");
function startDev() {
    window.symbol = symbol_1.default;
    window.isDev = true;
}
exports.default = startDev;
