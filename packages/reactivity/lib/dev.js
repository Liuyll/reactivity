"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const symbol_1 = __importDefault(require("./reactivity/symbol"));
function startDev() {
    window.symbol = symbol_1.default;
    window.isDev = true;
}
exports.default = startDev;
