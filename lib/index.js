"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mixInReact_1 = require("./mixInReact/mixInReact");
exports.mixInReact = mixInReact_1.default;
const createState_1 = require("./mixInReact/createState");
exports.createState = createState_1.createState;
exports.setRootState = createState_1.setRootState;
const dev_1 = require("./dev");
dev_1.default();
