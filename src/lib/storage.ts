/**
 * Save data to localStorage
 * @param key - The storage key
 * @param value - The value to store
 */
export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

/**
 * Load data from localStorage
 * @param key - The storage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns The loaded value or default
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
}

/**
 * Remove data from localStorage
 * @param key - The storage key to remove
 */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
}

