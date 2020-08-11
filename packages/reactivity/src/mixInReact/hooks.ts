export function useForceUpdate(React) {
    const { useState } = React
    // const [_,forceUpdate] = useReducer(state => {
    //     return ++state.a
    // },{a:1})
    // return forceUpdate
    const [_,forceUpdate] = useState(0)
    return () => forceUpdate(s => s+1)
}