## reactivity
一个数据驱动的响应核心

> 本仓库并不提供独立的dom操作库，只提供连接符合dom接口(`react`标准)规范的dom库的嵌入api。

如果你想使用现成的框架，可以移步[limbo](https://github.com/Liuyll/limbo)(一个集成了调度和事件系统的高性能现代前端框架)。并且使用我们提供的`mixInReact`来注册`limbo`。

如果你想使用符合规范的其他框架，请使用`reactivity/register`进行注册。

当然，最方便的还是使用我们提供的`reabo`来作为独立的`mvvm`框架使用。(实际上，它就是通过`reactivity/register`注册了`limbo`)

## install
```
yarn add @limbo/reactivity
```

## HOW TO USE
注意: `reactivity`本身可以以一个完整的`mvvm`框架形态使用,并且提供了高性能的独立`diff`包及一些静态优化,但我们还是希望用户能使用标准的`react`生态,所以独立`dom`需要引入额外的插件.

### mixInReact
要想在`react`里使用`reactivity`是非常简单的,只需要使用两行代码
```
import { mixInReact } from '@limbo/reactivity'
mixInReact(React)
```
从此,你可以快乐的在`React`里使用`reactivity`了.

### rootState
默认的,`reactivity`会为每一个`React.Component`注入一个名为`rootState`的对象,你可以直接操作这个对象上的任意值,并会直接得到响应

```
const A = (props) => {
    const handleClick = () => {
        props.rootState.a += 1
    }
    return (
        <button onClick={handleClick}></button>
    )
}
```
上面代码中,点击了按钮后,任何依赖`rootState.a`的组件都会更新


### createState
你可能会问,`rootState`究竟从哪里来呢?
`reactivity`提供了一个注册`rootState`的方法
```
setRootState(
    createState({
        a:1,
        b:2,
        c:{d:[1,2,3],e:1},
        f:{a:1,b:2}
    })
)
```
事实上,`createState`注册了一个`reactivity`概念上的`State`,然后通过
`setRootState`将它注册到`rootState`上.

### createRef
当然，如果你想像`vue3`一样创建一个单值属性，你也可以使用`createRef`

注意，你需要使用`value`来访问它。具体的，你可以参考`call by value`和`call by reference`的区别。
```
function App() {
    const ref = createRef(1)
    useEffect(() => {
        console.log(ref.value)
    })
    return <Son state={ref}/>
}
```

### createWatcher
作为响应式框架，`watcher`应该是很常见的功能。
它随着一个响应式变量的更新而触发提前定义好的响应操作。
```
function App() {
    const state = createState({
        userId: 'init'
    })
    const watch = createWatcher(state,'userId',(newState,oldId,newId) => {
        localStorage.setItem('id',newId)
    })
}
```
`createWatcher`的签名如下：
```
watcher:(state:State,key:any,onChange:IOnChange)
IOnChange:(newState: object, oldValue ?: any, newValue ?: any, changeKey ?: any) => void
```

### createCompued
同时,`reactivity`提供了计算功能，你可以像任何响应式框架(`vue`,`mobx`)一样使用`computed`
```
function App(props) {
    const computed = createComputed(() => props.state.a * props.state.b)
}
```
注意，`createComputed`需要传入一个函数

### anyState
是的,单一的`rootState`非常难以管理,我们希望在任何位置都能快速的创建一个
`State`,并提供响应式的能力,参考以下代码:

```
function App(props) {
  const A = createState({aa:1})
  return (
    <OtherState otherState={A}/>
  )
}
```
此时,你可以在`OtherState`里直接修改`A`的任意值,它也会触发响应式更新.

### computed

### watcher
当你在注册一个`State`时,实际上就是对一个`object`进行观察,同时`reactivity`也暴露出了一个`watcher`的API
```
let obj = {a:1,b:2}
obj = watcher(obj,() => console.log('i am not side-effect'))
```

### 修改
你可以对任意的`State`(不论是自动注入,或是手动创建的)进行修改.
#### Array
```
const A = createState([1,2,3])
A.length = 4
A[2] = 0
A.push(3)
```
上面的每一项都会触发响应式的更新,无需其他的心智负担.

#### nest-object
同样的,即使在深层次的嵌套对象的情况下,它也会完美的进行响应.
```
const A = {
    a: {
        b: {
            c
        }
    }
}
A.a.b.c = 3
```

## 性能

### one but only one update once
`reactivity`保证了当父子组件都需要更新的时候，但子组件先于父组件更新时，父组件不会再无效的`reconcile`子组件。

#### 如何定义无效更新
实际上，父组件传入的`props`不发生变化时，子组件不应该出现任何由父组件更新导致的变化。所以`reactivity`把`shallowequal`作为是否有效更新的判断标准。

#### 更新顺序
实际上，更新顺序在开启`schedule`后是由`react`决定的，父子组件在`updateQueue`中的位置并不由`reactivity`计算，但框架保证了必要情况下节省无效更新。

### 内存泄露
`reactivity`拥有非常好的依赖收集性能,它没有潜在的引用逃逸和闭包等问题,
旧的依赖都会在下次收集时被清除,无需担心依赖储存会导致内存泄漏.

### 依赖收集
很不幸的是,目前的响应式框架都存在非常大的问题: 轻量级的依赖收集在组件规模增大后,却会成为一个非常耗时的工作.

`reactivity`并没有办法解决它,但是有很多小技巧可以提升依赖收集过程的性能
.一个很常见的方法就是,不要使用嵌套层级太深的数据结构作为`State`,你应该打平而不是嵌套他们.
```
// good
const A = createState({a:1})
const B = createState({b:2})
const C = createState({c:3})

// bad
const nest = createState({a:{b:c}})
```
原因在于,你可以在任何地方创建`State`,所以对嵌套对象的依赖就没有那么必要了.

### 依赖清除
上面已经提到过,依赖清除会在第二次收集时进行.它的实现是标准的`double buffer`,具体细节不必深究.

## React生态
### 自动优化
在集成`reactivity`后,你的`React`应用不再需要使用繁琐的`memo`或者`PureComponent`来进行优化了,任何组件都会被自动的`shallowEqual`优化.

### 精确更新
使用响应式框架最诱人的一点就是,你不再需要使用`redux`里繁琐的`reselect`来进行性能提升,也不需要在每个层级组件上使用`useCallback`来增加额外的心智负担.任何组件都只会在你需要的时候被精确更新!

### 调度
`reactivity`不会干扰任何的`schedule`过程,也不会涉及到任何内部优先级的计算(统一为`forceUpdate`优先级)。

实际上，框架的实现并不是表面上的`mutable`，所以调度涉及到的多次更新不会影响到框架的运行，无需担心调度被框架干扰。

## 调试工具
`reactivity`提供了`History`进行时光回溯,并且提供标准的`chrome`插件,但目前暂未开源.

