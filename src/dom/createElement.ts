import { isPrimitive } from './tools'

export function createElement(type:Function | string,props:IProps,...children : Array<any> ):IElement {
    if(children.length > 0) {
        children = Array.prototype.slice.call(children)
        Array.prototype.forEach.call(children,(child,i) => {
            if(isPrimitive(child)) children[i] = createTextElement(child)
        })

        if(children.length > 1) props.children = children
        else props.children = children[0]
    }

    const element:IElement = {
        type,
        props
    }

    return element
}

function createTextElement(content:string) {
    return {
        type: content,
        props: {},
        isText: true
    }
}

export interface IElement {
    type: Function | String,
    props: IProps
    isText ?: boolean
}

export interface IProps {
    [key:string]: any;
    children ?: any | Array<any>
}