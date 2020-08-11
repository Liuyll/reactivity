"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Session {
    constructor() {
        this.stack = [];
    }
    push(payload) {
        this.stack.push(payload);
        return null;
    }
    pop() {
        return this.stack.pop();
    }
    peer() {
        return this.stack[this.stack.length - 1];
    }
}
exports.default = Session;
