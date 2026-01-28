/**
 * Date Utilities
 * Centralized date formatting to ensure consistent local timezone handling
 * across the app. Prevents UTC conversion bugs where late-night completions
 * appear as the next day in the calendar.
 */

/**
 * Get local date string in YYYY-MM-DD format
 * Uses local timezone (not UTC) to match user's perception of "today"
 *
 * @param date - Date to format (defaults to current date/time)
 * @returns Date string in YYYY-MM-DD format (e.g., "2026-01-28")
 *
 * @example
 * // User in PST at 11 PM on Jan 28
 * getLocalDateString() // Returns "2026-01-28" (correct)
 * // Old buggy method would return "2026-01-29" (wrong)
 */
export function getLocalDateString(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA'); // en-CA returns YYYY-MM-DD format
}

/**
 * Get date from N days ago in YYYY-MM-DD format
 * Useful for calculating week/month ranges
 *
 * @param daysAgo - Number of days in the past
 * @returns Date string in YYYY-MM-DD format
 *
 * @example
 * getDateNDaysAgo(7) // Returns date from 7 days ago in YYYY-MM-DD
 */
export function getDateNDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return getLocalDateString(date);
}

/**
 * Parse a date string (YYYY-MM-DD) into a Date object
 * Sets time to midnight local time to avoid timezone issues
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Date object at midnight local time
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Check if two date strings represent the same day
 *
 * @param date1 - First date string (YYYY-MM-DD)
 * @param date2 - Second date string (YYYY-MM-DD)
 * @returns true if dates are the same day
 */
export function isSameDay(date1: string, date2: string): boolean {
  return date1 === date2;
}

/**
 * Get start and end of current month in YYYY-MM-DD format
 *
 * @returns Object with firstDay and lastDay of current month
 */
export function getCurrentMonthRange(): { firstDay: string; lastDay: string } {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    firstDay: getLocalDateString(firstDay),
    lastDay: getLocalDateString(lastDay),
  };
}
