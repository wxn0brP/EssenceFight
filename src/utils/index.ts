export function debounce(func: (...args: any[]) => void, delay: number) {
    let timeoutId: any;
    return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
}