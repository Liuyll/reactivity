interface IUpdateNode {
    parent: IUpdateNode
}

function isPublicRoot(a:IUpdateNode, b:IUpdateNode) {
    return findRoot(a) === findRoot(b)
}

function findRoot(target:IUpdateNode) {
    while(target.parent) target = target.parent
    return target
}

function unite(a:IUpdateNode, b:IUpdateNode) {
    if(isPublicRoot(a,b)) return
    else {
        a.parent = b
    }
}

function UpdateNode() {
    this.parent = null
}

const nodeMap:Map<Function,IUpdateNode> = new Map()