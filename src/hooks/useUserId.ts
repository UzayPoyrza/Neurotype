/**
 * Hook to get the current user ID
 * Returns the test user ID from the store
 */

import { useStore } from '../store/useStore';

export function useUserId(): string | null {
  return useStore(state => state.userId);
}

