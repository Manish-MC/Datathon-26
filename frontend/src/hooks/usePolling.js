import { useState, useEffect, useRef } from 'react';
import { pollingManager } from '../api/PollingManager';

export function usePolling(key, fetchFn, interval = 10000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Keep the latest fetchFn without triggering re-renders
  const fetchFnRef = useRef(fetchFn);
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    // When the key or interval changes (unlikely in most cases), we resubscribe
    setLoading(true);
    const unsubscribe = pollingManager.subscribe(key, () => {
      const fn = fetchFnRef.current;
      return fn ? fn() : null;
    }, interval, (newData, newError) => {
      setData(newData);
      setError(newError);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [key, interval]);

  return { data, error, loading };
}
