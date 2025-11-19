interface TimeoutOptions extends DebounceOptions {}

class Timeout {
    timeout: NodeJS.Timeout;

    callback: (...args: any[]) => any;

    options: TimeoutOptions;

    maxTimestamp?: number;

    constructor(timeout: NodeJS.Timeout, callback: (...args: any[]) => any, options: TimeoutOptions) {
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
    private timeoutsMap = new Map<string, Timeout>();

    public has(key: string): boolean {
        return !!this.timeoutsMap.has(key);
    }

    public refresh(key: string): void {
        try {
            const timeout = this.timeoutsMap.get(key);
    
            timeout?.timeout.refresh();

            const remaining = this.remainingTime(key);
            if (remaining !== null && remaining <= 0) {
                this.execute(key);
            }
        }
        catch (_) {}
    };

    public execute(key: string): void {
        const timeout = this.timeoutsMap.get(key);
        if (!timeout) {
            return;
        }

        // Max wait time exceeded, invoke the callback immediately
        (async () => {
            try {
                if(timeout.options.trailing ?? true) {
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

    public save(key: string, timeout: NodeJS.Timeout, callback: (...args: any[]) => any, options: TimeoutOptions): void {
        this.timeoutsMap.set(key, new Timeout(timeout, callback, options));
    }

    public clear(key: string): void {
        if (this.timeoutsMap.has(key)) {
            const timeout = this.timeoutsMap.get(key);

            clearTimeout(timeout?.timeout);

            this.timeoutsMap.delete(key);
        }
    }

    public clearAll(): void {
        for (const [key, timeout] of this.timeoutsMap.entries()) {
            clearTimeout(timeout.timeout);
            this.timeoutsMap.delete(key);
        }
    }

    public remainingTime(key: string): number | null {
        const timeout = this.timeoutsMap.get(key);

        if (!timeout || !timeout.maxTimestamp) {
            return null;
        }

        const now = Date.now();
        return Math.max(0, timeout.maxTimestamp - now);
    }
}

const manager = new TimeoutManager();

export interface DebounceOptions {
    // Whether to invoke the function on the leading edge of the timeout
    // Default is false
    leading?: boolean;

    // Whether to invoke the function on the trailing edge of the timeout
    // Default is true
    trailing?: boolean;

    // Time to wait before invoking the function
    // Default is 2000 milliseconds
    wait?: number;

    // Maximum time to wait before invoking the function
    // When not specified, there is no maximum wait time
    maxWait?: number;
}

/*
 * Debounces a function identified by a unique key.
 * If the function is called again before the wait time elapses,
 * the timer is reset.
 * 
 * @param key Unique identifier for the debounced function
 * @param callback The function to debounce
 * @param options Configuration options for debouncing
*/
export function debounce(key: string, callback: (...args: any[]) => any, options?: DebounceOptions): void {
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

    if( manager.has(key)) {
        manager.refresh(key);
    } else {
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

/*
 * Clears all debounced functions and their timers.
*/
export function clearDebouncers(): void {
    manager.clearAll();
}