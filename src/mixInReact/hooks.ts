export function useForceUpdate(React,debug ?: any) {
    debug && console.log('forceUpdate:',debug)
    const { useState,useCallback } = React
    const [_,forceUpdate] = useState(0)
    return useCallback(() => forceUpdate(s => s+1),[])
}
