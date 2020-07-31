import { createElement } from './createElement'
import { render } from './render' 

const React = {
    createElement,
    render,
    useState:() => [{},() => {}]
}

export {
    React,
    createElement,
    render
}

