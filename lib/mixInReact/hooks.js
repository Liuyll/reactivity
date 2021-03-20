"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useVersionForceUpdate = exports.useForceUpdate = void 0;
function useForceUpdate(React, debug) {
    debug && console.log('forceUpdate:', debug);
    const { useState, useCallback } = React;
    const [_, forceUpdate] = useState(0);
    return useCallback(() => forceUpdate(s => s + 1), []);
}
exports.useForceUpdate = useForceUpdate;
// version update
function useVersionForceUpdate(React, versionRef) {
    const { useRef, useState, useLayoutEffect, useCallback, useEffect } = React;
    const version = useRef(0);
    const [_, forceUpdate] = useState(0);
    useLayoutEffect(() => {
        version.current++;
    });
    /**
     * 把更新外部version的时机放在useEffect里：
     * 1. 所有响应式forceUpdate全部会放在一个flush里batch掉
     * 2. 当走react逻辑的子更新优先进行时，我们保证了冗余的forceUpdate时会因版本不对而拒绝执行，所以解决了重复更新的问题
     * 3. 因为响应式更新被flush掉，所以react逻辑更新必定位于reactivity框架更新前
     */
    useEffect(() => {
        versionRef.current = version.current;
    });
    return useCallback((nextVersion) => {
        if (nextVersion > version.current) {
            forceUpdate(s => s + 1);
        }
    }, []);
}
exports.useVersionForceUpdate = useVersionForceUpdate;
