export interface DebounceOptions {
    // Whether to invoke the function on the leading edge of the timeout
    // Default is false
    leading?: boolean;

    // Whether to invoke the function on the trailing edge of the timeout
    // Default is true
    trailing?: boolean;

    // Time to wait before invoking the function
    // Default is 2000 milliseconds
    delay?: number;

    // Maximum time to wait before invoking the function
    // When not specified, there is no maximum wait time
    maxWait?: number;
}

export function debounce(key: string, callback: (...args: any[]) => any, options?: DebounceOptions): void {
    if (options?.leading && !has(key)) {
        (async () => {
            try {
                await callback();
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

export function clearDebouncers(): void {
    for (const key of timeoutsMap.keys()) {
        clear(key);
    }
}

const timeoutsMap = new Map<string, NodeJS.Timeout>();

function has(key: string): boolean {
    return !!timeoutsMap.has(key);
}

function save(key: string, timeout: NodeJS.Timeout): void {
    timeoutsMap.set(key, timeout);
}

function clear(key: string): void {
    if (timeoutsMap.has(key)) {
        clearTimeout(timeoutsMap.get(key));

        timeoutsMap.delete(key);
    }
}