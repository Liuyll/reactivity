interface IMessage {
    type ?: string
}

interface IStore extends IMessage {
    name: string,
    state: Object
}

interface IMutationMessage extends IMessage {
    store: string,
    old: MutationMessageValue,
    cur: MutationMessageValue,
    path: string,
    state: Object
}

type MutationMessageValue = string | Object | number | Array<any> | Symbol | Function

export {
    IMutationMessage,
    MutationMessageValue,
    IStore
}