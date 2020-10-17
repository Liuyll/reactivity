import React from 'react'
import ReactDOM from 'react-dom'
import { mixInReact, createRef } from '../src'

mixInReact(React)

const State = createRef(1)
function App(props) {
    return (
        <div>
            <div onClick={() => State.value++}>{State.value}</div>
        </div>
    )
}

ReactDOM.render(App,document.getElementById('root'))