/**
 * Unit tests for useLocalStorage hooks
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage, useLocalStorageSet } from '../useLocalStorage';

describe('useLocalStorage', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should return default value when no stored value exists', () => {
        const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
        expect(result.current[0]).toBe('default');
    });

    it('should persist value to localStorage', () => {
        const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

        act(() => {
            result.current[1]('new value');
        });

        expect(result.current[0]).toBe('new value');
        // Hook stores data with version wrapper: { version: 1, data: value }
        const stored = JSON.parse(localStorage.getItem('test-key') || '{}');
        expect(stored.data).toBe('new value');
    });

    it('should load existing value from localStorage', () => {
        localStorage.setItem('test-key', JSON.stringify('stored value'));

        const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
        expect(result.current[0]).toBe('stored value');
    });

    it('should handle complex objects', () => {
        const testObj = { name: 'test', count: 42 };
        const { result } = renderHook(() => useLocalStorage('obj-key', {}));

        act(() => {
            result.current[1](testObj);
        });

        expect(result.current[0]).toEqual(testObj);
    });
});

describe('useLocalStorageSet', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should return empty set when no stored value exists', () => {
        const { result } = renderHook(() => useLocalStorageSet<string>('set-key'));
        expect(result.current[0].size).toBe(0);
    });

    it('should add items to set using update function', () => {
        const { result } = renderHook(() => useLocalStorageSet<string>('set-key'));

        act(() => {
            result.current[1]((prev) => {
                const next = new Set(prev);
                next.add('item1');
                return next;
            });
        });

        expect(result.current[0].has('item1')).toBe(true);
        expect(result.current[0].size).toBe(1);
    });

    it('should remove items from set using update function', () => {
        const { result } = renderHook(() => useLocalStorageSet<string>('set-key'));

        act(() => {
            result.current[1]((prev) => {
                const next = new Set(prev);
                next.add('item1');
                next.add('item2');
                return next;
            });
        });

        act(() => {
            result.current[1]((prev) => {
                const next = new Set(prev);
                next.delete('item1');
                return next;
            });
        });

        expect(result.current[0].has('item1')).toBe(false);
        expect(result.current[0].has('item2')).toBe(true);
    });

    it('should persist set to localStorage', () => {
        const { result } = renderHook(() => useLocalStorageSet<string>('set-key'));

        act(() => {
            result.current[1]((prev) => {
                const next = new Set(prev);
                next.add('persisted-item');
                return next;
            });
        });

        const stored = JSON.parse(localStorage.getItem('set-key') || '[]');
        expect(stored).toContain('persisted-item');
    });
});
