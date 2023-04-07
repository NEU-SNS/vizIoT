/**
 * If the callback takes more than the `interval` to complete, then the next callback won't start until the last callback complete
 * @param {function} callback 
 * @param {number} interval 
 */
const customTimer = async (callback, interval) => {
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

module.exports = customTimer