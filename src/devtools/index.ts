let isDevtools

const checkDevtools = () => {
    if(document.getElementById('__reactivity_devtools_')) isDevtools = true
}

checkDevtools()

export {
    isDevtools
}