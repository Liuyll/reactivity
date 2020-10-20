"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useForceUpdate = void 0;
function useForceUpdate(React, debug) {
    debug && console.log('forceUpdate:', debug);
    const { useState, useCallback } = React;
    const [_, forceUpdate] = useState(0);
    return useCallback(() => forceUpdate(s => s + 1), []);
}
exports.useForceUpdate = useForceUpdate;
