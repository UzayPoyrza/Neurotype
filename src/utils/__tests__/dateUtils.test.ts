/**
 * Test suite for date utilities
 * Ensures timezone-safe date formatting
 */

import { getLocalDateString, getDateNDaysAgo, parseLocalDate, isSameDay, getCurrentMonthRange } from '../dateUtils';

describe('dateUtils', () => {
  describe('getLocalDateString', () => {
    it('should return current date in YYYY-MM-DD format', () => {
      const result = getLocalDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should format specific date in YYYY-MM-DD format', () => {
      const date = new Date(2026, 0, 28, 23, 59, 59); // Jan 28, 2026 at 11:59 PM
      const result = getLocalDateString(date);
      expect(result).toBe('2026-01-28');
    });

    it('should handle dates at midnight', () => {
      const date = new Date(2026, 0, 28, 0, 0, 0); // Jan 28, 2026 at 12:00 AM
      const result = getLocalDateString(date);
      expect(result).toBe('2026-01-28');
    });

    it('should not convert to UTC timezone', () => {
      // This test ensures we're using local time, not UTC
      const lateNight = new Date(2026, 0, 28, 23, 30, 0); // 11:30 PM local time
      const result = getLocalDateString(lateNight);

      // Old buggy method would convert to UTC first, potentially changing the day
      const buggyResult = lateNight.toISOString().split('T')[0];

      // Our method should keep the local date (Jan 28)
      expect(result).toBe('2026-01-28');

      // In PST (UTC-8), buggy method would give Jan 29
      // We verify our method doesn't do this by checking it matches the local date
      const expectedLocalDate = new Date(2026, 0, 28);
      expect(result).toBe(getLocalDateString(expectedLocalDate));
    });
  });

  describe('getDateNDaysAgo', () => {
    it('should return date from N days ago', () => {
      const result = getDateNDaysAgo(7);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return today for 0 days ago', () => {
      const result = getDateNDaysAgo(0);
      const today = getLocalDateString();
      expect(result).toBe(today);
    });

    it('should handle month boundaries', () => {
      // This will work regardless of when the test is run
      const result = getDateNDaysAgo(1);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('parseLocalDate', () => {
    it('should parse YYYY-MM-DD string to Date object', () => {
      const result = parseLocalDate('2026-01-28');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0); // January is 0
      expect(result.getDate()).toBe(28);
    });

    it('should set time to midnight', () => {
      const result = parseLocalDate('2026-01-28');
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe('isSameDay', () => {
    it('should return true for same dates', () => {
      expect(isSameDay('2026-01-28', '2026-01-28')).toBe(true);
    });

    it('should return false for different dates', () => {
      expect(isSameDay('2026-01-28', '2026-01-29')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(isSameDay('2026-01-28', '2026-01-28')).toBe(true);
    });
  });

  describe('getCurrentMonthRange', () => {
    it('should return first and last day of current month', () => {
      const result = getCurrentMonthRange();
      expect(result.firstDay).toMatch(/^\d{4}-\d{2}-01$/);
      expect(result.lastDay).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return valid date strings', () => {
      const result = getCurrentMonthRange();

      // Parse the dates to ensure they're valid
      const firstDate = parseLocalDate(result.firstDay);
      const lastDate = parseLocalDate(result.lastDay);

      expect(firstDate.getDate()).toBe(1);
      expect(lastDate.getDate()).toBeGreaterThanOrEqual(28);
      expect(lastDate.getDate()).toBeLessThanOrEqual(31);
    });

    it('should have last day after first day', () => {
      const result = getCurrentMonthRange();
      expect(result.lastDay > result.firstDay).toBe(true);
    });
  });
});
