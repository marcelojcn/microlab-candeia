export interface DebounceOptions {
    leading?: boolean;
    trailing?: boolean;
    wait?: number;
    maxWait?: number;
}
export declare function debounce(key: string, callback: (...args: any[]) => any, options?: DebounceOptions): void;
export declare function clearDebouncers(): void;
//# sourceMappingURL=index.d.ts.map