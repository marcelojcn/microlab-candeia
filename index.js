export function debounce(key, callback, options) {
    if (options?.leading && !has(key)) {
        (async () => {
            try {
                callback();
            }
            catch (error) {
                console.error(`Error in leading debounced function for key "${key}":`, error);
            }
        })();
    }
    clear(key);
    const delay = options?.delay ?? 2000;
    const newTimeout = setTimeout(async () => {
        try {
            if (options?.trailing ?? true) {
                await callback();
            }
        }
        catch (error) {
            console.error(`Error in trainling debounced function for key "${key}":`, error);
        }
        finally {
            clear(key);
        }
    }, delay);
    save(key, newTimeout);
}
export function clearDebouncers() {
    for (const key of timeoutsMap.keys()) {
        clear(key);
    }
}
const timeoutsMap = new Map();
function has(key) {
    return !!timeoutsMap.has(key);
}
function save(key, timeout) {
    timeoutsMap.set(key, timeout);
}
function clear(key) {
    if (timeoutsMap.has(key)) {
        clearTimeout(timeoutsMap.get(key));
        timeoutsMap.delete(key);
    }
}
//# sourceMappingURL=index.js.map