import { useState, useEffect, useCallback } from 'react';

interface StorageSchema {
    version: number;
    data: unknown;
}

const CURRENT_VERSION = 1;

/**
 * A localStorage hook with versioning support.
 * Handles migrations and provides type-safe access to persisted data.
 */
export function useLocalStorage<T>(
    key: string,
    defaultValue: T,
    migrate?: (oldData: unknown, oldVersion: number) => T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
    const [value, setValue] = useState<T>(() => {
        try {
            const stored = localStorage.getItem(key);
            if (!stored) return defaultValue;

            const parsed = JSON.parse(stored);

            // Handle versioned data
            if (parsed && typeof parsed === 'object' && 'version' in parsed && 'data' in parsed) {
                const schema = parsed as StorageSchema;
                if (schema.version === CURRENT_VERSION) {
                    return schema.data as T;
                }
                // Migration needed
                if (migrate) {
                    return migrate(schema.data, schema.version);
                }
                return defaultValue;
            }

            // Legacy unversioned data - migrate to versioned format
            if (migrate) {
                return migrate(parsed, 0);
            }
            return parsed as T;
        } catch {
            return defaultValue;
        }
    });

    const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
        setValue((prev) => {
            const nextValue = typeof newValue === 'function'
                ? (newValue as (prev: T) => T)(prev)
                : newValue;

            const schema: StorageSchema = {
                version: CURRENT_VERSION,
                data: nextValue
            };
            localStorage.setItem(key, JSON.stringify(schema));
            return nextValue;
        });
    }, [key]);

    const clearValue = useCallback(() => {
        localStorage.removeItem(key);
        setValue(defaultValue);
    }, [key, defaultValue]);

    return [value, setStoredValue, clearValue];
}

/**
 * Simple localStorage hook for Set data structures
 */
export function useLocalStorageSet<T>(
    key: string
): [Set<T>, (updater: (prev: Set<T>) => Set<T>) => void] {
    const [set, setSet] = useState<Set<T>>(() => {
        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                return new Set(JSON.parse(stored));
            }
        } catch {
            // Ignore parse errors
        }
        return new Set();
    });

    const updateSet = useCallback((updater: (prev: Set<T>) => Set<T>) => {
        setSet((prev) => {
            const next = updater(prev);
            localStorage.setItem(key, JSON.stringify([...next]));
            return next;
        });
    }, [key]);

    return [set, updateSet];
}

/**
 * Sync state to localStorage on changes (for legacy compatibility)
 */
export function useSyncToStorage<T>(key: string, value: T) {
    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);
}
