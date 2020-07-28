import React from 'react'
import ReactDOM from 'react-dom'

import { mixInReact,createState,setRootState } from '../src'

mixInReact(React)

const State = createState({
    a:1,
    b:2
})

setRootState(State)

function App(props) {
    return (
        <div>{props.rootState.a}</div>
    )
}

ReactDOM.render(App,document.getElementById('root'))