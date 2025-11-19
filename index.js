class Timeout {
    timeout;
    callback;
    options;
    maxTimestamp;
    constructor(timeout, callback, options) {
        this.timeout = timeout;
        this.callback = callback;
        this.options = options;
        if (options.maxWait) {
            const now = Date.now();
            this.maxTimestamp = now + options.maxWait;
        }
    }
}
class TimeoutManager {
    timeoutsMap = new Map();
    has(key) {
        return !!this.timeoutsMap.has(key);
    }
    refresh(key) {
        try {
            const timeout = this.timeoutsMap.get(key);
            timeout?.timeout.refresh();
            const remaining = this.remainingTime(key);
            if (remaining !== null && remaining <= 0) {
                this.execute(key);
            }
        }
        catch (_) { }
    }
    ;
    execute(key) {
        const timeout = this.timeoutsMap.get(key);
        if (!timeout) {
            return;
        }
        // Max wait time exceeded, invoke the callback immediately
        (async () => {
            try {
                if (timeout.options.trailing ?? true) {
                    await timeout.callback();
                }
            }
            catch (error) {
                console.error(`Error in maxWait debounced function for key "${key}":`, error);
            }
            finally {
                this.clear(key);
            }
        })();
    }
    save(key, timeout, callback, options) {
        this.timeoutsMap.set(key, new Timeout(timeout, callback, options));
    }
    clear(key) {
        if (this.timeoutsMap.has(key)) {
            const timeout = this.timeoutsMap.get(key);
            clearTimeout(timeout?.timeout);
            this.timeoutsMap.delete(key);
        }
    }
    clearAll() {
        for (const [key, timeout] of this.timeoutsMap.entries()) {
            clearTimeout(timeout.timeout);
            this.timeoutsMap.delete(key);
        }
    }
    remainingTime(key) {
        const timeout = this.timeoutsMap.get(key);
        if (!timeout || !timeout.maxTimestamp) {
            return null;
        }
        const now = Date.now();
        return Math.max(0, timeout.maxTimestamp - now);
    }
}
const manager = new TimeoutManager();
export function debounce(key, callback, options) {
    if (options?.leading && !manager.has(key)) {
        (async () => {
            try {
                await callback();
            }
            catch (error) {
                console.error(`Error in leading debounced function for key "${key}":`, error);
            }
        })();
    }
    if (manager.has(key)) {
        manager.refresh(key);
    }
    else {
        const wait = options?.wait ?? 2000;
        const timeout = setTimeout(async () => {
            try {
                if (options?.trailing ?? true) {
                    await callback();
                }
            }
            catch (error) {
                console.error(`Error when executing debounced function for key "${key}":`, error);
            }
            finally {
                manager.clear(key);
            }
        }, wait);
        manager.save(key, timeout, callback, { ...options, wait });
    }
}
export function clearDebouncers() {
    manager.clearAll();
}
//# sourceMappingURL=index.js.map