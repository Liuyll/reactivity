"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.camel2hyphen = exports.isPrimitive = void 0;
function isPrimitive(value) {
    return (typeof value === 'string' ||
        typeof value === 'number' ||
        // $flow-disable-line
        typeof value === 'symbol' ||
        typeof value === 'boolean');
}
exports.isPrimitive = isPrimitive;
function camel2hyphen(s) {
    return s.replace(/([A-Z])/g, '_$1').toLowerCase();
}
exports.camel2hyphen = camel2hyphen;
