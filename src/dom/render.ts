import { camel2hyphen } from './tools'
import { IElement } from './createElement'

export function render(element:IElement,parentNode:HTMLElement) {
    const {
        type,
        props:_props,
        isText
    } = element

    const {
        key,
        ref,
        __self,
        __source,
        ...props
    } = _props

    // console.log(type)
    let domElement:HTMLElement
    if(isText) {
        return parentNode.appendChild(
            document.createTextNode(type as string)
        )
    }
    else if(typeof type === 'function') {
        return domElement = render(type(props),parentNode) as any
    }

    else {       
        domElement = document.createElement(type as string)
    
        const propHandle = {
            children: (children) => {
                children = Array.isArray(children) ? children : [children]
                children.forEach(child => render(child,domElement))
            },

            className: (className) => domElement.className = className,
            id: (id) => domElement.id = id,
            style: (style) => {
                let cssText = ''
                for(let styName in style) {
                    cssText += `;${camel2hyphen(styName)}:${style[styName]}`
                }
                domElement.style.cssText = cssText
            },
            default: (prop,name) => {
                console.log(domElement)
                domElement.setAttribute(name,prop)
            } 
        }

        for(let propName in props) {
            if (!propHandle[propName]) {
                if(propName.substring(0, 2) !== '__') propHandle['default'](props[propName], propName);
            }
            else propHandle[propName](props[propName], propName)
        }
    }

    // console.log(domElement)
    return parentNode.appendChild(domElement)
}