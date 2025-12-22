import { useRef, useState, useEffect, useMemo, type ReactNode } from 'react';

interface VirtualizedListProps<T> {
    items: T[];
    itemHeight: number;
    containerHeight: number;
    renderItem: (item: T, index: number) => ReactNode;
    overscan?: number;
    className?: string;
}

/**
 * A simple virtualized list that only renders visible items.
 * For use with large data sets to improve performance.
 */
export function VirtualizedList<T>({
    items,
    itemHeight,
    containerHeight,
    renderItem,
    overscan = 5,
    className = ''
}: VirtualizedListProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            setScrollTop(container.scrollTop);
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const { visibleItems, startIndex, totalHeight, offsetY } = useMemo(() => {
        const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
        const endIdx = Math.min(
            items.length - 1,
            Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
        );

        return {
            visibleItems: items.slice(startIdx, endIdx + 1),
            startIndex: startIdx,
            totalHeight: items.length * itemHeight,
            offsetY: startIdx * itemHeight
        };
    }, [items, itemHeight, containerHeight, scrollTop, overscan]);

    if (items.length === 0) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className={`overflow-y-auto ${className}`}
            style={{ height: containerHeight }}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
                    {visibleItems.map((item, index) => (
                        <div key={startIndex + index} style={{ height: itemHeight }}>
                            {renderItem(item, startIndex + index)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Hook to measure container height dynamically
 */
export function useContainerHeight(ref: React.RefObject<HTMLElement | null>, fallback = 400) {
    const [height, setHeight] = useState(fallback);

    useEffect(() => {
        if (!ref.current) return;

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                setHeight(entry.contentRect.height);
            }
        });

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [ref]);

    return height;
}
