const noop = () => {};
if(typeof window !== 'undefined') {
    Object.defineProperty(window, 'scrollTo', {value: noop, writable: true})
}