import { useState, useEffect } from "react";

/**
 * Debounces a value by the specified delay.
 * Useful for reducing re-renders during rapid input changes like typing in search boxes.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * const [query, setQuery] = useState("");
 * const debouncedQuery = useDebounce(query, 300);
 *
 * // debouncedQuery only updates 300ms after user stops typing
 * useEffect(() => {
 *   // Search API call using debouncedQuery
 * }, [debouncedQuery]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set up timer to update debounced value after delay
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clear timeout if value changes or component unmounts
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}
