"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = void 0;
const tools_1 = require("./tools");
function render(element, parentNode) {
    const { type, props: _props, isText } = element;
    const { key, ref, __self, __source } = _props, props = __rest(_props
    // console.log(type)
    , ["key", "ref", "__self", "__source"]);
    // console.log(type)
    let domElement;
    if (isText) {
        return parentNode.appendChild(document.createTextNode(type));
    }
    else if (typeof type === 'function') {
        return domElement = render(type(props), parentNode);
    }
    else {
        domElement = document.createElement(type);
        const propHandle = {
            children: (children) => {
                children = Array.isArray(children) ? children : [children];
                children.forEach(child => render(child, domElement));
            },
            className: (className) => domElement.className = className,
            id: (id) => domElement.id = id,
            style: (style) => {
                let cssText = '';
                for (let styName in style) {
                    cssText += `;${tools_1.camel2hyphen(styName)}:${style[styName]}`;
                }
                domElement.style.cssText = cssText;
            },
            default: (prop, name) => {
                console.log(domElement);
                domElement.setAttribute(name, prop);
            }
        };
        for (let propName in props) {
            if (!propHandle[propName]) {
                if (propName.substring(0, 2) !== '__')
                    propHandle['default'](props[propName], propName);
            }
            else
                propHandle[propName](props[propName], propName);
        }
    }
    // console.log(domElement)
    return parentNode.appendChild(domElement);
}
exports.render = render;
