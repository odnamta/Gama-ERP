'use client';

/**
 * useWidgetData Hook
 * v0.34: Dashboard Widgets & Customization
 * 
 * Fetches widget data on mount, handles loading and error states,
 * and supports manual refresh.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWidgetData, hasDataFetcher } from '@/lib/widget-data-fetchers';
import type { WidgetData } from '@/types/widgets';

interface UseWidgetDataResult {
  data: WidgetData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useWidgetData(
  widgetCode: string,
  settings?: Record<string, unknown>
): UseWidgetDataResult {
  const [data, setData] = useState<WidgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  
  // Track settings changes
  const settingsRef = useRef(settings);
  
  const fetchData = useCallback(async () => {
    if (!hasDataFetcher(widgetCode)) {
      setError(`No data fetcher for widget: ${widgetCode}`);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchWidgetData(widgetCode, settingsRef.current);
      
      if (isMounted.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch widget data');
        setData(null);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [widgetCode]);

  // Fetch data on mount and when widget code changes
  useEffect(() => {
    isMounted.current = true;
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [fetchData]);

  // Re-fetch when settings change
  useEffect(() => {
    const settingsChanged = JSON.stringify(settings) !== JSON.stringify(settingsRef.current);
    
    if (settingsChanged) {
      settingsRef.current = settings;
      fetchData();
    }
  }, [settings, fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refresh,
  };
}

export default useWidgetData;
