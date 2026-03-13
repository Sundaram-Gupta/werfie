import { useEffect, useRef, useCallback } from 'react';

/**
 * Refetches when the tab/window gains focus (e.g. user switches back to admin tab).
 * Useful for keeping admin data fresh when changes happen elsewhere.
 */
export function useRefreshOnFocus(refetch) {
    const refetchRef = useRef(refetch);
    refetchRef.current = refetch;

    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible' && typeof refetchRef.current === 'function') {
                refetchRef.current();
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, []);
}

/**
 * Polls by refetching at a given interval.
 */
export function useRefreshInterval(refetch, intervalMs) {
    const refetchRef = useRef(refetch);
    refetchRef.current = refetch;

    useEffect(() => {
        if (!intervalMs || intervalMs <= 0) return;
        const id = setInterval(() => {
            if (typeof refetchRef.current === 'function') {
                refetchRef.current();
            }
        }, intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);
}
