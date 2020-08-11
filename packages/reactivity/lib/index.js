"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDom = exports.setRootState = exports.createState = exports.mixInReact = void 0;
const config_1 = require("./config");
const mixInReact_1 = __importDefault(require("./mixInReact/mixInReact"));
exports.mixInReact = mixInReact_1.default;
const createState_1 = require("./mixInReact/createState");
Object.defineProperty(exports, "createState", { enumerable: true, get: function () { return createState_1.createState; } });
Object.defineProperty(exports, "setRootState", { enumerable: true, get: function () { return createState_1.setRootState; } });
const dev_1 = __importDefault(require("./dev"));
dev_1.default();
function registerDom() {
    config_1.setRegisterDom(true);
}
exports.registerDom = registerDom;
