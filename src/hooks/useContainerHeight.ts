import { useState, useEffect } from "react";

/**
 * Hook to measure container height dynamically
 */
export function useContainerHeight(
  ref: React.RefObject<HTMLElement | null>,
  fallback = 400,
) {
  const [height, setHeight] = useState(fallback);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setHeight(entry.contentRect.height);
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return height;
}
