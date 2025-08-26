/**
 * Currency formatter for USD
 */
export const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

/**
 * Parse a currency string to a number
 * @param value - The currency string to parse
 * @returns The parsed number or 0 if invalid
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a number as currency string
 * @param value - The number to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number): string {
  return currency.format(value);
}

/**
 * Format a number as percentage
 * @param value - The number to format (0-1)
 * @returns Formatted percentage string
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Format a date as MM/DD/YYYY
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  // Parse the date as local time to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

