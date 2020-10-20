
const hasOwn = Object.prototype.hasOwnProperty

function is(x, y) {
  if (x === y) {
    return x !== 0 || y !== 0 || 1 / x === 1 / y
  } else {
    return x !== x && y !== y
  }
}

function isDep(x,y) {
  return (typeof x === 'object' && typeof y === 'object') ? shallowEqual(x,y) : is(x,y)
}

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

export function shallowEqual(objA, objB, isDev=false) {
  if (is(objA, objB)) return true

  if (typeof objA !== 'object' || objA === null ||
      typeof objB !== 'object' || objB === null) {
    return false
  }

  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) return false

  for (let i = 0; i < keysA.length; i++) {
    if (!hasOwn.call(objB, keysA[i]) ||
        !(isDev ? isDep : is)(objA[keysA[i]], objB[keysA[i]])) {
      return false
    }
  }

  return true
}
