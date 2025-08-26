import { useState, useEffect } from 'react';
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

  // Load initial state from IndexedDB
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await indexedDBService.getSetting(key, initial);
        setState(savedState);
      } catch (error) {
        console.error('Failed to load from IndexedDB:', error);
        setState(initial);
      } finally {
        setIsLoaded(true);
      }
    };

    loadState();
  }, [key, initial]);

  // Save state to IndexedDB when it changes
  useEffect(() => {
    if (isLoaded) {
      const saveState = async () => {
        try {
          await indexedDBService.saveSetting(key, state);
        } catch (error) {
          console.error('Failed to save to IndexedDB:', error);
        }
      };

      saveState();
    }
  }, [key, state, isLoaded]);

  return [state, setState];
}
