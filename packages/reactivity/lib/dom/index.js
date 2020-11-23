"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = exports.createElement = exports.React = void 0;
const createElement_1 = require("./createElement");
Object.defineProperty(exports, "createElement", { enumerable: true, get: function () { return createElement_1.createElement; } });
const render_1 = require("./render");
Object.defineProperty(exports, "render", { enumerable: true, get: function () { return render_1.render; } });
const React = {
    createElement: createElement_1.createElement,
    render: render_1.render,
    useState: () => [{}, () => { }]
};
exports.React = React;
