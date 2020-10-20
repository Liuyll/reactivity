 export function isPrimitive (value) {
    return (
        typeof value === 'string' ||
        typeof value === 'number' ||
        // $flow-disable-line
        typeof value === 'symbol' ||
        typeof value === 'boolean'
    )
}

export function camel2hyphen(s:string) {
    return s.replace(/([A-Z])/g,'_$1').toLowerCase()
}

