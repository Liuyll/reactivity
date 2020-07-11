import { useReducer } from 'react'

export function useForceUpdate() {
    const [_,forceUpdate] = useReducer({a:1},(state) => state.a++)
    return forceUpdate
}