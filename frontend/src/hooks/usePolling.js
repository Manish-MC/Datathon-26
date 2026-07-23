import { useState, useEffect } from 'react';
import { pollingManager } from '../api/PollingManager';

export function usePolling(key, fetchFn, interval = 10000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // When the key or interval changes (unlikely in most cases), we resubscribe
    setLoading(true);
    const unsubscribe = pollingManager.subscribe(key, fetchFn, interval, (newData, newError) => {
      setData(newData);
      setError(newError);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [key, interval, fetchFn]);

  return { data, error, loading };
}
