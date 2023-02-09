function _throttle(fn, wait = 200) {
    let last, timer, now;
    return function () {
        now = Date.now();
        if (last && now - last < wait) {
            clearTimeout(timer);
            timer = setTimeout(function () {
                last = now;
                fn.call(this, ...arguments);
            }, wait);
        } else {
            last = now;
            fn.call(this, ...arguments);
        }
    };
}


function _debounce(callback, delay) {
    let timer;

    return function (...args) {
        clearTimeout(timer);

        timer = setTimeout(() => {
            callback.apply(this, args);
        }, delay);
    };
}

export { _debounce, _throttle };