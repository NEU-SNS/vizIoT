const timerState = {}

/**
 * If the callback takes more than the `interval` to complete, then the next callback won't start until the last callback complete
 * @param {function} callback 
 * @param {number} interval 
 */
const customTimer = async (callback, interval) => {
    if (timerState[callback] == false) {
        return;
    }
    
    // small amount of wait time to allow for some garbage collection
    const minWaitTime = 10
    const start = Date.now();
    await callback()
    const runTime = Date.now() - start

    if (interval - runTime < minWaitTime) {
        setTimeout(() => { customTimer(callback, interval) }, minWaitTime)
    } else {
        const waitTime = interval - runTime
        setTimeout(() => { customTimer(callback, interval) }, waitTime)
    }
}

/**
 * It uses the callback as the key to stop the timer, so there can't be multiple customTimers that use the same callback
 * @param {function} callback 
 */
const clearCustomTimer = (callback) => {
    timerState[callback] = false;
}

/**
 * It uses the callback as the key to start the timer, so there can't be multiple customTimers that use the same callback
 * @param {function} callback 
 */
const startCustomTimer = (callback) => {
    timerState[callback] = true;
}

module.exports = { customTimer, clearCustomTimer, startCustomTimer}