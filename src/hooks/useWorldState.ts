import { useState, useEffect, useCallback } from 'react';
import { fetchWorldState } from '../services/warframeApi';
import type { WorldState } from '../types';

interface UseWorldStateResult {
    worldState: WorldState | null;
    error: string | null;
    isLoading: boolean;
    refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage Warframe world state data.
 * Automatically refreshes every 15 seconds.
 */
export function useWorldState(): UseWorldStateResult {
    const [worldState, setWorldState] = useState<WorldState | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setError(null);
        const data = await fetchWorldState();
        if (data) {
            setWorldState(data);
            setError(null);
        } else {
            setError("Unable to connect to Warframe servers. This may be due to network restrictions or API downtime.");
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        // Initial fetch
        loadData();

        // Quiet API refresh every 15 seconds
        const apiInterval = setInterval(() => {
            fetchWorldState().then(data => {
                if (data) setWorldState(data);
            });
        }, 15000);

        return () => {
            clearInterval(apiInterval);
        };
    }, [loadData]);

    return {
        worldState,
        error,
        isLoading,
        refresh: loadData
    };
}

/**
 * Hook to trigger re-renders every second for countdown timers.
 */
export function useTickTimer(intervalMs: number = 1000): number {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, intervalMs);

        return () => clearInterval(interval);
    }, [intervalMs]);

    return tick;
}
