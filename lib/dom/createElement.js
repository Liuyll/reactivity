"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createElement = void 0;
const tools_1 = require("./tools");
function createElement(type, props, ...children) {
    if (children.length > 0) {
        children = Array.prototype.slice.call(children);
        Array.prototype.forEach.call(children, (child, i) => {
            if (tools_1.isPrimitive(child))
                children[i] = createTextElement(child);
        });
        if (children.length > 1)
            props.children = children;
        else
            props.children = children[0];
    }
    const element = {
        type,
        props,
        $$limbo_typeof: Symbol()
    };
    return element;
}
exports.createElement = createElement;
function createTextElement(content) {
    return {
        type: content,
        props: {},
        isText: true
    };
}
