import { useState, useEffect } from 'react';
import { saveToStorage, loadFromStorage } from '../lib/storage';

/**
 * Custom hook that mirrors useState but syncs to localStorage
 * @param key - The localStorage key
 * @param initial - The initial value
 * @returns [state, setState] tuple
 */
export function useLocalState<T>(key: string, initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    return loadFromStorage(key, initial);
  });

  useEffect(() => {
    saveToStorage(key, state);
  }, [key, state]);

  return [state, setState];
}

