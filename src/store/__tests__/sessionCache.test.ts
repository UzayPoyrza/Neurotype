/**
 * Test suite for session caching functionality
 * Tests that sessions are properly cached when modules are loaded
 * and that MeditationDetailScreen can retrieve cached sessions instantly
 */

import { useStore } from '../useStore';
import type { Session } from '../../types';

describe('Session Cache', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useStore.getState();
    store.resetAppData();
  });

  describe('cacheSessions', () => {
    it('should cache multiple sessions', () => {
      const store = useStore.getState();
      
      const sessions: Session[] = [
        {
          id: 'session-1',
          title: 'Test Session 1',
          durationMin: 10,
          modality: 'mindfulness',
          goal: 'anxiety',
          description: 'Test description 1',
          whyItWorks: 'Test why it works 1',
        },
        {
          id: 'session-2',
          title: 'Test Session 2',
          durationMin: 15,
          modality: 'sound',
          goal: 'focus',
          description: 'Test description 2',
          whyItWorks: 'Test why it works 2',
        },
      ];

      store.cacheSessions(sessions);

      const cached1 = store.getCachedSession('session-1');
      const cached2 = store.getCachedSession('session-2');

      expect(cached1).toEqual(sessions[0]);
      expect(cached2).toEqual(sessions[1]);
      expect(cached1?.description).toBe('Test description 1');
      expect(cached1?.whyItWorks).toBe('Test why it works 1');
    });

    it('should update existing cached sessions', () => {
      const store = useStore.getState();
      
      const session1: Session = {
        id: 'session-1',
        title: 'Original Title',
        durationMin: 10,
        modality: 'mindfulness',
        goal: 'anxiety',
      };

      const session2: Session = {
        id: 'session-1',
        title: 'Updated Title',
        durationMin: 15,
        modality: 'sound',
        goal: 'focus',
        description: 'Updated description',
      };

      store.cacheSessions([session1]);
      store.cacheSessions([session2]);

      const cached = store.getCachedSession('session-1');
      expect(cached?.title).toBe('Updated Title');
      expect(cached?.description).toBe('Updated description');
    });

    it('should cache sessions with all required fields for MeditationDetail', () => {
      const store = useStore.getState();
      
      const session: Session = {
        id: 'session-1',
        title: 'Complete Session',
        durationMin: 20,
        modality: 'visualization',
        goal: 'sleep',
        description: 'Full description for detail screen',
        whyItWorks: 'Complete explanation of why this works',
      };

      store.cacheSessions([session]);

      const cached = store.getCachedSession('session-1');
      
      // Verify all fields needed by MeditationDetailScreen are present
      expect(cached?.id).toBe('session-1');
      expect(cached?.title).toBe('Complete Session');
      expect(cached?.durationMin).toBe(20);
      expect(cached?.modality).toBe('visualization');
      expect(cached?.goal).toBe('sleep');
      expect(cached?.description).toBe('Full description for detail screen');
      expect(cached?.whyItWorks).toBe('Complete explanation of why this works');
    });
  });

  describe('getCachedSession', () => {
    it('should return null for non-existent session', () => {
      const store = useStore.getState();
      const cached = store.getCachedSession('non-existent');
      expect(cached).toBeNull();
    });

    it('should return cached session if it exists', () => {
      const store = useStore.getState();
      
      const session: Session = {
        id: 'test-session',
        title: 'Test',
        durationMin: 10,
        modality: 'mindfulness',
        goal: 'anxiety',
      };

      store.cacheSessions([session]);
      const cached = store.getCachedSession('test-session');
      
      expect(cached).not.toBeNull();
      expect(cached?.id).toBe('test-session');
    });

    it('should return session with all detail fields', () => {
      const store = useStore.getState();
      
      const session: Session = {
        id: 'detail-session',
        title: 'Detail Session',
        durationMin: 15,
        modality: 'movement',
        goal: 'sleep',
        description: 'This is a detailed description',
        whyItWorks: 'This explains why it works',
      };

      store.cacheSessions([session]);
      const cached = store.getCachedSession('detail-session');
      
      expect(cached).not.toBeNull();
      expect(cached?.description).toBe('This is a detailed description');
      expect(cached?.whyItWorks).toBe('This explains why it works');
    });
  });

  describe('Integration: ModuleDetailScreen -> MeditationDetailScreen flow', () => {
    it('should cache sessions when module loads, then retrieve instantly', () => {
      const store = useStore.getState();
      
      // Simulate ModuleDetailScreen loading sessions
      const moduleSessions: Session[] = [
        {
          id: 'module-session-1',
          title: 'Module Session 1',
          durationMin: 10,
          modality: 'mindfulness',
          goal: 'anxiety',
          description: 'Module description 1',
          whyItWorks: 'Module why it works 1',
        },
        {
          id: 'module-session-2',
          title: 'Module Session 2',
          durationMin: 15,
          modality: 'sound',
          goal: 'focus',
          description: 'Module description 2',
          whyItWorks: 'Module why it works 2',
        },
      ];

      // ModuleDetailScreen caches sessions
      store.cacheSessions(moduleSessions);

      // MeditationDetailScreen retrieves from cache (should be instant, no loading)
      const retrieved1 = store.getCachedSession('module-session-1');
      const retrieved2 = store.getCachedSession('module-session-2');

      expect(retrieved1).not.toBeNull();
      expect(retrieved2).not.toBeNull();
      expect(retrieved1?.description).toBe('Module description 1');
      expect(retrieved2?.description).toBe('Module description 2');
      expect(retrieved1?.whyItWorks).toBe('Module why it works 1');
      expect(retrieved2?.whyItWorks).toBe('Module why it works 2');
    });

    it('should handle multiple modules caching different sessions', () => {
      const store = useStore.getState();
      
      // Module 1 sessions
      const module1Sessions: Session[] = [
        {
          id: 'module1-session-1',
          title: 'Module 1 Session',
          durationMin: 10,
          modality: 'mindfulness',
          goal: 'anxiety',
          description: 'Module 1 description',
        },
      ];

      // Module 2 sessions
      const module2Sessions: Session[] = [
        {
          id: 'module2-session-1',
          title: 'Module 2 Session',
          durationMin: 15,
          modality: 'sound',
          goal: 'focus',
          description: 'Module 2 description',
        },
      ];

      // Cache both modules' sessions
      store.cacheSessions(module1Sessions);
      store.cacheSessions(module2Sessions);

      // Both should be retrievable
      const cached1 = store.getCachedSession('module1-session-1');
      const cached2 = store.getCachedSession('module2-session-1');

      expect(cached1).not.toBeNull();
      expect(cached2).not.toBeNull();
      expect(cached1?.title).toBe('Module 1 Session');
      expect(cached2?.title).toBe('Module 2 Session');
    });
  });

  describe('Cache persistence', () => {
    it('should maintain cache across multiple cache operations', () => {
      const store = useStore.getState();
      
      const session1: Session = {
        id: 'session-1',
        title: 'Session 1',
        durationMin: 10,
        modality: 'mindfulness',
        goal: 'anxiety',
      };

      const session2: Session = {
        id: 'session-2',
        title: 'Session 2',
        durationMin: 15,
        modality: 'sound',
        goal: 'focus',
      };

      store.cacheSessions([session1]);
      store.cacheSessions([session2]);

      // Both should still be in cache
      expect(store.getCachedSession('session-1')).not.toBeNull();
      expect(store.getCachedSession('session-2')).not.toBeNull();
    });
  });
});

