/**
 * Normalize a label to a camelCase key
 * @param label - The label to normalize
 * @returns A camelCase key
 */
export function normalizeKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+(\w)/g, (_, char) => char.toUpperCase()) // Convert spaces to camelCase
    .replace(/^\w/, (char) => char.toLowerCase()); // Ensure first character is lowercase
}

/**
 * Convert a camelCase key to Title Case for display
 * @param key - The camelCase key to convert
 * @returns A Title Case string
 */
export function titleCase(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
}

