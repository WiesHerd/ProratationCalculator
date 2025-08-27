import { useState, useEffect, useRef, useCallback } from 'react';
import { indexedDBService } from '../lib/indexedDB';

/**
 * Custom hook that mirrors useState but syncs to IndexedDB
 * @param key - The storage key
 * @param initial - The initial value
 * @returns [state, setState] tuple
 */
export function useIndexedDBState<T>(key: string, initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initial);
  const [isLoaded, setIsLoaded] = useState(false);
  const isInitialLoad = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial state from IndexedDB
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await indexedDBService.getSetting(key, initial);
        if (isInitialLoad.current) {
          setState(savedState);
          isInitialLoad.current = false;
        }
      } catch (error) {
        console.error('Failed to load from IndexedDB:', error);
        if (isInitialLoad.current) {
          setState(initial);
          isInitialLoad.current = false;
        }
      } finally {
        setIsLoaded(true);
      }
    };

    loadState();
  }, [key, initial]);

  // Debounced save to IndexedDB
  const debouncedSave = useCallback(async (value: T) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await indexedDBService.saveSetting(key, value);
      } catch (error) {
        console.error('Failed to save to IndexedDB:', error);
      }
    }, 300); // 300ms debounce
  }, [key]);

  // Save state to IndexedDB when it changes (debounced)
  useEffect(() => {
    if (isLoaded && !isInitialLoad.current) {
      debouncedSave(state);
    }
  }, [state, isLoaded, debouncedSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const setStateWithIndexedDB = useCallback((value: T | ((prev: T) => T)) => {
    setState(value);
  }, []);

  return [state, setStateWithIndexedDB];
}
