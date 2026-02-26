import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent, Dimensions, Animated } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore, prerenderedModuleBackgrounds, createSubtleBackground, createDarkIconBackground } from '../store/useStore';
import { theme } from '../styles/theme';
import { SubscriptionBadge } from '../components/SubscriptionBadge';
import { mentalHealthModules } from '../data/modules';
import type { MentalHealthModule } from '../data/modules';
import { MergedCard } from '../components/MergedCard';
import type { Session, EmotionalFeedbackLabel } from '../types';
import { InfoBox } from '../components/InfoBox';
import { getUserCompletedSessions } from '../services/progressService';
import { getSessionById } from '../services/sessionService';
import { useUserId } from '../hooks/useUserId';
import { removeEmotionalFeedback as removeEmotionalFeedbackDB } from '../services/feedbackService';
import type { CompletedSessionCacheEntry } from '../store/useStore';
import { ShimmerActivityHistory, ShimmerEmotionalFeedbackHistory } from '../components/ShimmerSkeleton';
import { getSubscriptionDetails } from '../services/userService';
import { GiftIcon } from '../components/icons/GiftIcon';
import { ActivityHistoryIcon } from '../components/icons/ActivityHistoryIcon';
import { ChatWritingIcon } from '../components/icons/ChatWritingIcon';

const MAX_VISIBLE_ACTIVITY_ITEMS = 4;
const APPROX_ACTIVITY_ROW_HEIGHT = 84;

const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) {
    return text;
  }

  const trimmed = text.slice(0, maxLength).trimEnd();
  return `${trimmed}...`;
};

const formatSessionDate = (rawDate?: string): string | null => {
  if (!rawDate) {
    return null;
  }

  const hasTimeComponent = rawDate.includes('T');
  const parsedDate = new Date(hasTimeComponent ? rawDate : `${rawDate}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  if (hasTimeComponent) {
    const datePart = parsedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const timePart = parsedDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${datePart} at ${timePart}`;
  }

  return parsedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const feedbackColorMap: Record<EmotionalFeedbackLabel, string> = {
  Bad: '#ff4757',
  Meh: '#ffa502',
  Okay: '#ffd700',
  Good: '#2ed573',
  Great: '#1e90ff',
};

const formatTimestamp = (timestampSeconds: number): string => {
  const minutes = Math.floor(timestampSeconds / 60);
  const seconds = Math.max(0, Math.floor(timestampSeconds % 60));
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Subscription: undefined;
  Payment: { selectedPlan?: string | null };
};

type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

type TouchableOpacityRef = React.ComponentRef<typeof TouchableOpacity>;

// Animated wrapper for emotional feedback item to handle removal animation
const AnimatedFeedbackItem: React.FC<{
  children: React.ReactNode;
  isRemoving: boolean;
  onAnimationComplete: () => void;
}> = ({ children, isRemoving, onAnimationComplete }) => {
  const opacity = React.useRef(new Animated.Value(1)).current;
  const translateX = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(1)).current;
  
  React.useEffect(() => {
    if (isRemoving) {
      // Animate out: fade, slide to the right, and scale down
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 300,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onAnimationComplete();
      });
    } else {
      // Reset for new items
      opacity.setValue(1);
      translateX.setValue(0);
      scale.setValue(1);
    }
  }, [isRemoving, opacity, translateX, scale, onAnimationComplete]);
  
  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateX }, { scale }],
      }}
    >
      {children}
    </Animated.View>
  );
};

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { 
    userProgress,
    subscriptionType,
    completedSessionsCache,
    emotionalFeedbackHistory: emotionalFeedbackHistoryFromStore,
    removeDuplicateCacheEntries,
  } = useStore();
  
  // Get store instance for accessing state outside of render
  const getStoreState = useStore.getState;
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  const setCurrentScreen = useStore(state => state.setCurrentScreen);
  const userFirstName = useStore(state => state.userFirstName);
  const todayModuleId = useStore(state => state.todayModuleId);
  const ambientModule = mentalHealthModules.find(m => m.id === todayModuleId) || mentalHealthModules[0];
  const [mainScrollY, setMainScrollY] = React.useState(0);
  const [emotionalFeedbackHistory, setEmotionalFeedbackHistory] = React.useState<any[]>([]);

  const userId = useUserId();
  const [completedSessions, setCompletedSessions] = React.useState<any[]>([]);
  const [sessionsById, setSessionsById] = React.useState<Record<string, Session>>({});
  // Initialize loading state: false if cache has data, true otherwise
  const [isLoadingActivity, setIsLoadingActivity] = React.useState(completedSessionsCache.length === 0);
  const [isLoadingFeedback, setIsLoadingFeedback] = React.useState(emotionalFeedbackHistoryFromStore.length === 0);
  // Get subscription cancel date from store (loaded during app initialization)
  const subscriptionCancelAt = useStore(state => state.subscriptionCancelAt);
  
  // Track processed cache entries to avoid reprocessing
  const processedCacheKeysRef = React.useRef<Set<string>>(new Set());
  // Track last processed feedback to prevent infinite loops
  const lastProcessedFeedbackRef = React.useRef<string>('');

  const modulesById = React.useMemo(() => {
    return mentalHealthModules.reduce<Record<string, MentalHealthModule>>((acc, module) => {
      acc[module.id] = module;
      return acc;
    }, {});
  }, []);

  // Helper function to process cache entries into activity format
  const processCacheToActivity = React.useCallback(async (cacheEntries: CompletedSessionCacheEntry[]) => {
    if (cacheEntries.length === 0) return [];
    
    // Fetch session details for cache entries
    const sessionPromises = cacheEntries.map(async (entry) => {
      const session = await getSessionById(entry.sessionId);
      return {
        completedSession: {
          id: entry.id,
          session_id: entry.sessionId,
          context_module: entry.moduleId || null,
          completed_date: entry.date,
          minutes_completed: entry.minutesCompleted,
          created_at: entry.createdAt,
        },
        session,
      };
    });
    
    const results = await Promise.all(sessionPromises);
    
    // Build sessionsById map
    const sessionsMap: Record<string, Session> = {};
    results.forEach(({ session }) => {
      if (session) {
        sessionsMap[session.id] = session;
      }
    });
    setSessionsById(prev => ({ ...prev, ...sessionsMap }));
    
    // Transform to activity format
    return results
      .filter(({ session }) => session !== null)
      .map(({ completedSession, session }) => ({
        id: completedSession.id || completedSession.session_id,
        sessionId: completedSession.session_id,
        moduleId: completedSession.context_module || undefined,
        date: completedSession.completed_date,
        minutesCompleted: completedSession.minutes_completed,
        createdAt: completedSession.created_at || completedSession.completed_date,
      }));
  }, []);

  // Helper function to process store feedback entries (uses cached sessions first)
  const processStoreFeedback = React.useCallback(async (storeEntries: typeof emotionalFeedbackHistoryFromStore) => {
    if (storeEntries.length === 0) return [];
    
    // Fetch session details for feedback entries (try cache first)
    const feedbackWithSessions = await Promise.all(
      storeEntries.map(async (entry) => {
        // Try to get session from cache first
        let session = getStoreState().getCachedSession(entry.sessionId);
        
        // If not in cache, fetch it
        if (!session) {
          session = await getSessionById(entry.sessionId);
          if (session) {
            // Cache it for future use
            getStoreState().cacheSessions([session]);
          }
        }
        
        return {
          feedback: {
            id: entry.id || `feedback-${entry.date}-${entry.sessionId}`,
            session_id: entry.sessionId,
            label: entry.label,
            timestamp_seconds: entry.timestampSeconds,
            feedback_date: entry.date,
          },
          session,
        };
      })
    );
    
    // Build sessionsById map
    const feedbackSessionsMap: Record<string, Session> = {};
    feedbackWithSessions.forEach(({ session }) => {
      if (session) {
        feedbackSessionsMap[session.id] = session;
      }
    });
    setSessionsById(prev => ({ ...prev, ...feedbackSessionsMap }));
    
    // Transform to expected format
    return feedbackWithSessions
      .filter(({ session }) => session !== null)
      .map(({ feedback: fb }) => ({
        id: fb.id || `feedback-${fb.feedback_date}-${fb.session_id}`,
        sessionId: fb.session_id,
        label: fb.label,
        timestampSeconds: fb.timestamp_seconds,
        date: fb.feedback_date,
      }));
  }, [getStoreState]);

  // Initialize from cache immediately on mount
  React.useEffect(() => {
    const initializeFromCache = async () => {
      if (completedSessionsCache.length > 0) {
        console.log('📊 [ProfileScreen] Initializing from cache:', completedSessionsCache.length, 'entries');
        const activity = await processCacheToActivity(completedSessionsCache);
        setCompletedSessions(activity);
        
        // Mark all initialized entries as processed
        activity.forEach(item => {
          const key = `${item.sessionId}-${item.createdAt}`;
          processedCacheKeysRef.current.add(key);
        });
        
        setIsLoadingActivity(false);
      }
      
      if (emotionalFeedbackHistoryFromStore.length > 0) {
        console.log('📊 [ProfileScreen] Initializing feedback from store:', emotionalFeedbackHistoryFromStore.length, 'entries');
        // Set the ref to prevent reprocessing in the other effect
        const feedbackKey = emotionalFeedbackHistoryFromStore
          .map(e => `${e.id || e.sessionId}-${e.date}-${e.timestampSeconds}`)
          .join('|');
        lastProcessedFeedbackRef.current = feedbackKey;
        const feedback = await processStoreFeedback(emotionalFeedbackHistoryFromStore);
        setEmotionalFeedbackHistory(feedback);
        setIsLoadingFeedback(false);
      }
    };
    
    initializeFromCache();
  }, []); // Only run on mount

  // Refresh subscription details when screen comes into focus (to catch any updates)
  useFocusEffect(
    React.useCallback(() => {
      const refreshSubscriptionDetails = async () => {
        if (userId && subscriptionType === 'premium') {
          console.log('🔄 [ProfileScreen] Screen focused, refreshing subscription details...');
          const details = await getSubscriptionDetails(userId);
          if (details) {
            useStore.getState().setSubscriptionCancelAt(details.cancelAt);
            console.log('✅ [ProfileScreen] Subscription details refreshed on focus');
          }
        }
      };
      refreshSubscriptionDetails();
    }, [userId, subscriptionType])
  );

  // Update UI immediately when cache changes (e.g., when meditation completes)
  // Merges new cache entries with existing completedSessions and removes overwritten entries
  React.useEffect(() => {
    const updateFromCache = async () => {
      if (completedSessionsCache.length === 0) return;
      
      // Create a map of cache entries by sessionId + moduleId + date for overwrite detection
      // Key: "sessionId-moduleId-date", Value: createdAt
      const cacheBySessionModuleDate = new Map<string, string>();
      completedSessionsCache.forEach(entry => {
        const cleanSessionId = entry.sessionId.replace('-today', '');
        const key = `${cleanSessionId}-${entry.moduleId || 'null'}-${entry.date}`;
        // Keep the most recent createdAt for this session+module+date combo
        const existing = cacheBySessionModuleDate.get(key);
        if (!existing || entry.createdAt > existing) {
          cacheBySessionModuleDate.set(key, entry.createdAt);
        }
      });
      
      // Create a set of current cache keys for cleanup (using cleaned sessionId)
      const currentCacheKeys = new Set(
        completedSessionsCache.map(entry => {
          const cleanSessionId = entry.sessionId.replace('-today', '');
          return `${cleanSessionId}-${entry.createdAt}`;
        })
      );
      
      // Clean up processedCacheKeysRef - remove keys that are no longer in cache
      // This includes overwritten entries (old createdAt keys)
      const keysToRemove: string[] = [];
      processedCacheKeysRef.current.forEach(key => {
        if (!currentCacheKeys.has(key)) {
          keysToRemove.push(key);
        }
      });
      keysToRemove.forEach(key => processedCacheKeysRef.current.delete(key));
      
      if (keysToRemove.length > 0) {
        console.log(`🧹 [ProfileScreen] Cleaned up ${keysToRemove.length} old processed cache keys`);
      }
      
      // Remove entries from UI state that were overwritten
      // An entry is overwritten if there's a cache entry with same sessionId + moduleId + date but different createdAt
      setCompletedSessions(prev => {
        const filtered = prev.filter(entry => {
          const cleanSessionId = entry.sessionId.replace('-today', '');
          const key = `${cleanSessionId}-${entry.moduleId || 'null'}-${entry.date}`;
          const cacheCreatedAt = cacheBySessionModuleDate.get(key);
          
          // Keep entry if:
          // 1. There's no cache entry for this session+module+date (it's from database, not cache)
          // 2. OR the createdAt matches (it's the current version, not overwritten)
          if (!cacheCreatedAt) {
            return true; // Keep database entries that aren't in cache
          }
          
          // If there's a cache entry, only keep if createdAt matches (not overwritten)
          const shouldKeep = entry.createdAt === cacheCreatedAt;
          if (!shouldKeep) {
            console.log(`🧹 [ProfileScreen] Removing overwritten entry:`, {
              sessionId: entry.sessionId,
              moduleId: entry.moduleId,
              date: entry.date,
              oldCreatedAt: entry.createdAt,
              newCreatedAt: cacheCreatedAt,
            });
          }
          return shouldKeep;
        });
        
        if (filtered.length !== prev.length) {
          console.log(`🧹 [ProfileScreen] Removed ${prev.length - filtered.length} overwritten entries from UI`);
        }
        
        return filtered;
      });
      
      // Find new cache entries that haven't been processed yet
      // Use cleaned sessionId for consistency
      const newCacheEntries = completedSessionsCache.filter(entry => {
        const cleanSessionId = entry.sessionId.replace('-today', '');
        const key = `${cleanSessionId}-${entry.createdAt}`;
        const isNew = !processedCacheKeysRef.current.has(key);
        if (isNew) {
          console.log('📊 [ProfileScreen] Found new cache entry:', {
            sessionId: entry.sessionId,
            cleanSessionId,
            createdAt: entry.createdAt,
            moduleId: entry.moduleId,
            date: entry.date,
          });
        }
        return isNew;
      });
      
      if (newCacheEntries.length === 0) {
        console.log('📊 [ProfileScreen] No new cache entries to add');
        return;
      }
      
      console.log('📊 [ProfileScreen] Cache updated, adding', newCacheEntries.length, 'new entries');
      
      // Mark these entries as processed (using cleaned sessionId)
      newCacheEntries.forEach(entry => {
        const cleanSessionId = entry.sessionId.replace('-today', '');
        const key = `${cleanSessionId}-${entry.createdAt}`;
        processedCacheKeysRef.current.add(key);
      });
      
      // Process new cache entries
      const sessionPromises = newCacheEntries.map(async (entry) => {
        const session = await getSessionById(entry.sessionId);
        return {
          completedSession: {
            id: entry.id,
            session_id: entry.sessionId,
            context_module: entry.moduleId || null,
            completed_date: entry.date,
            minutes_completed: entry.minutesCompleted,
            created_at: entry.createdAt,
          },
          session,
        };
      });
      
      const results = await Promise.all(sessionPromises);
      
      // Build sessionsById map for new entries
      const newSessionsMap: Record<string, Session> = {};
      results.forEach(({ session }) => {
        if (session) {
          newSessionsMap[session.id] = session;
        }
      });
      setSessionsById(prev => ({ ...prev, ...newSessionsMap }));
      
      // Transform new entries to activity format
      const newActivity = results
        .filter(({ session }) => session !== null)
        .map(({ completedSession, session }) => ({
          id: completedSession.id || completedSession.session_id,
          sessionId: completedSession.session_id,
          moduleId: completedSession.context_module || undefined,
          date: completedSession.completed_date,
          minutesCompleted: completedSession.minutes_completed,
          createdAt: completedSession.created_at || completedSession.completed_date,
        }));
      
      // Merge with existing sessions, deduplicate, and sort
      setCompletedSessions(prev => {
        // Use cleaned sessionId for deduplication
        const merged = [...newActivity, ...prev]
          .filter((entry, index, self) => {
            const cleanId = entry.sessionId.replace('-today', '');
            const key = `${cleanId}-${entry.createdAt}`;
            return index === self.findIndex(e => {
              const eCleanId = e.sessionId.replace('-today', '');
              return `${eCleanId}-${e.createdAt}` === key;
            });
          })
          .sort((a, b) => {
            const aTime = new Date(a.createdAt).getTime();
            const bTime = new Date(b.createdAt).getTime();
            return bTime - aTime; // Most recent first
          })
          .slice(0, 20); // Keep top 20
        
        console.log('📊 [ProfileScreen] Merged to', merged.length, 'total sessions', {
          newEntries: newActivity.length,
          prevEntries: prev.length,
        });
        return merged;
      });
      
      setIsLoadingActivity(false);
    };
    
    updateFromCache();
  }, [completedSessionsCache]);

  // Update UI immediately when store feedback changes
  React.useEffect(() => {
    const updateFromStore = async () => {
      if (emotionalFeedbackHistoryFromStore.length === 0) {
        // Reset ref when array becomes empty
        lastProcessedFeedbackRef.current = '';
        setEmotionalFeedbackHistory([]);
        setIsLoadingFeedback(false);
        return;
      }

      // Create a stable key from the feedback entries to detect actual changes
      const feedbackKey = emotionalFeedbackHistoryFromStore
        .map(e => `${e.id || e.sessionId}-${e.date}-${e.timestampSeconds}`)
        .join('|');
      
      // Skip if we've already processed this exact feedback
      if (lastProcessedFeedbackRef.current === feedbackKey) {
        console.log('📊 [ProfileScreen] Feedback already processed, skipping');
        return;
      }

      console.log('📊 [ProfileScreen] Store feedback updated, refreshing from store');
      lastProcessedFeedbackRef.current = feedbackKey;
      const feedback = await processStoreFeedback(emotionalFeedbackHistoryFromStore);
      setEmotionalFeedbackHistory(feedback);
      setIsLoadingFeedback(false);
    };
    
    updateFromStore();
  }, [emotionalFeedbackHistoryFromStore]); // Removed processStoreFeedback from deps

  // Set screen context when component mounts
  React.useEffect(() => {
    setCurrentScreen('profile');
  }, [setCurrentScreen]);

  // Fetch completed sessions from database (only on app open, not on focus)
  // Removes duplicate cache entries before adding DB entries
  const fetchActivityHistory = React.useCallback(async () => {
    if (!userId) {
      console.log('📊 [ProfileScreen] No user ID, skipping activity history fetch');
      setIsLoadingActivity(false);
      return;
    }

    console.log('📊 [ProfileScreen] Fetching activity history from database (app open)...');
    // Only show loading if we don't have cache data
    if (completedSessionsCache.length === 0) {
      setIsLoadingActivity(true);
    }
    
    try {
      // Fetch completed sessions from database (most recent first, limit 20)
      const completed = await getUserCompletedSessions(userId, 20);
      console.log('📊 [ProfileScreen] Fetched', completed.length, 'completed sessions from database');
      console.log('📊 [ProfileScreen] Cache has', completedSessionsCache.length, 'entries');
      
      // Remove duplicate cache entries that match DB entries
      if (completed.length > 0) {
        removeDuplicateCacheEntries(completed.map(c => ({
          session_id: c.session_id,
          created_at: c.created_at || c.completed_date,
        })));
      }
      
      // Get updated cache after removing duplicates
      const updatedCache = getStoreState().completedSessionsCache;
      console.log('📊 [ProfileScreen] Cache after deduplication:', updatedCache.length, 'entries');
      
      // Convert remaining cache entries to same format as DB entries
      const cacheEntries = updatedCache.map(entry => ({
        id: entry.id,
        session_id: entry.sessionId,
        context_module: entry.moduleId || null,
        completed_date: entry.date,
        minutes_completed: entry.minutesCompleted,
        created_at: entry.createdAt,
      }));
      
      // Combine remaining cache and DB (DB takes precedence, cache is for new entries not yet in DB)
      const allSessions = [...cacheEntries, ...completed]
        .filter((entry, index, self) => {
          const key = `${entry.session_id}-${entry.created_at}`;
          return index === self.findIndex(e => `${e.session_id}-${e.created_at}` === key);
        })
        .sort((a, b) => {
          const aTime = new Date(a.created_at || a.completed_date).getTime();
          const bTime = new Date(b.created_at || b.completed_date).getTime();
          return bTime - aTime; // Most recent first
        })
        .slice(0, 20); // Keep top 20
      
      console.log('📊 [ProfileScreen] Final merged count:', allSessions.length, 'total sessions');
      
      // Fetch session details for each completed session
      const sessionPromises = allSessions.map(async (cs) => {
        const session = await getSessionById(cs.session_id);
        return { completedSession: cs, session };
      });
      
      const results = await Promise.all(sessionPromises);
      
      // Build sessionsById map
      const sessionsMap: Record<string, Session> = {};
      results.forEach(({ session }) => {
        if (session) {
          sessionsMap[session.id] = session;
        }
      });
      setSessionsById(sessionsMap);
      
      // Transform completed sessions to activity format
      const activity = results
        .filter(({ session }) => session !== null)
        .map(({ completedSession, session }) => ({
          id: completedSession.id || completedSession.session_id,
          sessionId: completedSession.session_id,
          moduleId: completedSession.context_module || undefined,
          date: completedSession.completed_date,
          minutesCompleted: completedSession.minutes_completed,
          createdAt: completedSession.created_at || completedSession.completed_date,
        }));
      
      console.log('📊 [ProfileScreen] Processed', activity.length, 'activity items');
      setCompletedSessions(activity);
      
      // Mark all processed entries in the ref
      activity.forEach(item => {
        const key = `${item.sessionId}-${item.createdAt}`;
        processedCacheKeysRef.current.add(key);
      });
    } catch (error) {
      console.error('❌ [ProfileScreen] Error fetching activity history:', error);
    } finally {
      setIsLoadingActivity(false);
    }
  }, [userId, completedSessionsCache, removeDuplicateCacheEntries, processCacheToActivity]);

  // Fetch from database ONLY on app open (when userId is first set)
  // This runs once when the app opens, not on every focus
  const hasFetchedOnOpen = React.useRef(false);
  React.useEffect(() => {
    if (userId && !hasFetchedOnOpen.current) {
      console.log('📊 [ProfileScreen] App opened, fetching activity history from database...');
      hasFetchedOnOpen.current = true;
      // Small delay to let cache initialization complete first
      const timer = setTimeout(() => {
        fetchActivityHistory();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [userId, fetchActivityHistory]);

  // Use completed sessions as recent activity (already sorted most recent first)
  const recentActivity = completedSessions;
  // Emotional feedback is already sorted by feedback_date descending from the service
  const sortedFeedbackHistory = emotionalFeedbackHistory;

  const moduleId = todayModuleId || 'anxiety';
  const activeModule = mentalHealthModules.find(module => module.id === moduleId);
  const moduleBorderColor = activeModule?.color || theme.colors.primary;
  const avatarBackgroundColor = prerenderedModuleBackgrounds[moduleId] || '#f2f2f7';
  const profileInitial = userFirstName?.trim().charAt(0)?.toUpperCase() || 'N';
  const visibleActivityCount = Math.min(recentActivity.length, MAX_VISIBLE_ACTIVITY_ITEMS);
  const activityListMaxHeight = visibleActivityCount * APPROX_ACTIVITY_ROW_HEIGHT;
  const hasScrollableOverflow = recentActivity.length > MAX_VISIBLE_ACTIVITY_ITEMS;
  const [isScrollHintVisible, setIsScrollHintVisible] = React.useState(hasScrollableOverflow);
  const visibleFeedbackCount = Math.min(sortedFeedbackHistory.length, MAX_VISIBLE_ACTIVITY_ITEMS);
  const feedbackListMaxHeight = visibleFeedbackCount * APPROX_ACTIVITY_ROW_HEIGHT;
  const hasFeedbackOverflow = sortedFeedbackHistory.length > MAX_VISIBLE_ACTIVITY_ITEMS;
  const [isFeedbackScrollHintVisible, setIsFeedbackScrollHintVisible] = React.useState(hasFeedbackOverflow);
  const [showFeedbackInfoBox, setShowFeedbackInfoBox] = React.useState(false);
  const [isFeedbackInfoActive, setIsFeedbackInfoActive] = React.useState(false);
  const [feedbackInfoPosition, setFeedbackInfoPosition] = React.useState<{ top: number; right: number }>({
    top: 120,
    right: 20,
  });
  const feedbackInfoButtonRef = React.useRef<TouchableOpacityRef | null>(null);
  const [showRemoveFeedbackToast, setShowRemoveFeedbackToast] = React.useState(false);
  const toastAnim = React.useRef(new Animated.Value(0)).current;
  const [removingFeedbackIds, setRemovingFeedbackIds] = React.useState<Set<string>>(new Set());

  // Handle removing emotional feedback (both from store and database)
  const handleRemoveEmotionalFeedback = React.useCallback(async (entryId: string) => {
    if (!userId) {
      console.warn('⚠️ [ProfileScreen] No user ID, cannot remove feedback');
      return;
    }

    // Mark item as removing to trigger animation
    setRemovingFeedbackIds(prev => new Set(prev).add(entryId));
  }, [userId]);

  // Handle animation complete callback - remove from state and database
  const handleRemoveAnimationComplete = React.useCallback(async (entryId: string) => {
    if (!userId) {
      console.warn('⚠️ [ProfileScreen] No user ID, cannot remove feedback');
      return;
    }

    // Remove from UI state
    setEmotionalFeedbackHistory(prev => prev.filter(entry => entry.id !== entryId));
    setRemovingFeedbackIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(entryId);
      return newSet;
    });
    
    // Remove from database
    console.log('💾 [ProfileScreen] Removing emotional feedback from database:', entryId);
    const result = await removeEmotionalFeedbackDB(userId, entryId);
    
    if (result.success) {
      console.log('✅ [ProfileScreen] Emotional feedback removed successfully');
      
      // Show toast notification
      toastAnim.stopAnimation();
      toastAnim.setValue(0);
      setShowRemoveFeedbackToast(true);
      
      Animated.sequence([
        Animated.timing(toastAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowRemoveFeedbackToast(false);
      });
    } else {
      console.error('❌ [ProfileScreen] Failed to remove emotional feedback:', result.error);
      // Re-process cache to restore the correct state
      if (emotionalFeedbackHistoryFromStore.length > 0) {
        const feedback = await processStoreFeedback(emotionalFeedbackHistoryFromStore);
        setEmotionalFeedbackHistory(feedback);
      }
    }
  }, [userId, toastAnim]);

  React.useEffect(() => {
    if (!hasScrollableOverflow) {
      setIsScrollHintVisible(false);
    } else {
      setIsScrollHintVisible(true);
    }
  }, [hasScrollableOverflow]);

  const handleActivityScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!hasScrollableOverflow) {
        return;
      }

      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
      const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 8;

      if (isAtBottom && isScrollHintVisible) {
        setIsScrollHintVisible(false);
      } else if (!isAtBottom && !isScrollHintVisible) {
        setIsScrollHintVisible(true);
      }
    },
    [hasScrollableOverflow, isScrollHintVisible]
  );

  React.useEffect(() => {
    if (!hasFeedbackOverflow) {
      setIsFeedbackScrollHintVisible(false);
    } else {
      setIsFeedbackScrollHintVisible(true);
    }
  }, [hasFeedbackOverflow]);

  const handleFeedbackScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!hasFeedbackOverflow) {
        return;
      }

      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
      const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 8;

      if (isAtBottom && isFeedbackScrollHintVisible) {
        setIsFeedbackScrollHintVisible(false);
      } else if (!isAtBottom && !isFeedbackScrollHintVisible) {
        setIsFeedbackScrollHintVisible(true);
      }
    },
    [hasFeedbackOverflow, isFeedbackScrollHintVisible]
  );

  const INFO_BOX_VERTICAL_GAP = 0;

  const handleFeedbackInfoPress = React.useCallback(() => {
    setIsFeedbackInfoActive(true);
    const buttonInstance = feedbackInfoButtonRef.current;
    if (buttonInstance && typeof (buttonInstance as any).measureInWindow === 'function') {
      (buttonInstance as any).measureInWindow((x: number, y: number, width: number, height: number) => {
        const windowWidth = Dimensions.get('window').width;
        const margin = 16;
        const calculatedTop = Math.max(margin, y + height + INFO_BOX_VERTICAL_GAP);
        const calculatedRight = Math.max(margin, windowWidth - (x + width));
        setFeedbackInfoPosition({
          top: calculatedTop,
          right: calculatedRight,
        });
        setShowFeedbackInfoBox(true);
      });
    } else {
      setShowFeedbackInfoBox(true);
    }
  }, []);

  const handleCloseFeedbackInfoBox = React.useCallback(() => {
    setShowFeedbackInfoBox(false);
    setIsFeedbackInfoActive(false);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
      {/* Ambient top glow based on selected module color - fades on scroll */}
      <Animated.View style={[styles.ambientGlow, { opacity: Math.max(0, 1 - mainScrollY / 150) }]} pointerEvents="none">
        <LinearGradient
          colors={[ambientModule.color + '50', ambientModule.color + '18', 'transparent']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Sticky Header */}
      <View style={[styles.stickyHeader, { backgroundColor: globalBackgroundColor }]}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color="#A0A0B0" />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={(e) => setMainScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >

        {/* Profile Header Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.profileHeaderContent}>
            <View style={styles.profilePictureWrapper}>
              <View
                style={[
                  styles.profileInitialContainer,
                  {
                    borderColor: moduleBorderColor,
                    backgroundColor: avatarBackgroundColor,
                  }
                ]}
              >
                <Text style={[styles.profileInitialText, { color: moduleBorderColor }]}>
                  {profileInitial}
                </Text>
              </View>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Current Plan</Text>
              <View style={[
                styles.subscriptionContainer,
                subscriptionType === 'premium' && styles.subscriptionContainerPremium
              ]}>
                <SubscriptionBadge 
                  subscriptionType={subscriptionType}
                  size="medium"
                />
              </View>
              {subscriptionType === 'premium' && subscriptionCancelAt && (
                <View style={styles.cancelMessageContainer}>
                  <Text style={styles.cancelMessageText}>
                    Your subscription ends at {new Date(subscriptionCancelAt).toLocaleDateString()}. Go to settings to manage your subscription.
                  </Text>
                </View>
              )}
              {subscriptionType === 'basic' && (
                <TouchableOpacity 
                  style={styles.upgradeButton}
                  activeOpacity={0.7}
                  onPress={() => {
                    navigation.navigate('Subscription');
                  }}
                >
                  <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Share & Stats Merged Card */}
        <MergedCard>
          <MergedCard.Section style={[styles.mergedSectionTop, styles.mergedSectionReducedBottomPadding]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderTop}>
                <View style={styles.cardTitleContainer}>
                  <View style={styles.cardTitleIconWrapper}>
                    <GiftIcon size={23} color="#0A84FF" />
                  </View>
                  <View style={styles.cardTitleTextWrapper}>
                    <Text style={styles.cardTitle}>Share & Earn</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.shareSubtitle}>
                Give your friends 30 days of premium
              </Text>
            </View>
            
            <View style={styles.shareContent}>

              <View style={styles.stepsList}>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>Share your unique referral link</Text>
                </View>
                
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>Friend downloads and signs up</Text>
                </View>
                
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>They get 30 days of premium free!</Text>
                </View>
              </View>

              <View style={styles.referralSection}>
                <Text style={styles.referralLabel}>Your referral link:</Text>
                <View style={styles.referralLinkContainer}>
                  <Text style={styles.referralLink}>www.neurotypeapp.com/ref/user123</Text>
                  <TouchableOpacity style={styles.copyButton}>
                    <Text style={styles.copyButtonText}>Copy</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.shareButton}>
                  <Text style={styles.shareButtonText}>Share Link</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.inviteButton}>
                  <Text style={styles.inviteButtonText}>Send Invite</Text>
                </TouchableOpacity>
              </View>
            </View>
          </MergedCard.Section>

          <MergedCard.Section style={[styles.mergedSectionAfterDivider, styles.statsSection, styles.mergedSectionIncreasedTopPadding]}>
            <View style={styles.statsContent}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Friends Invited</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Credits Earned</Text>
              </View>
            </View>
          </MergedCard.Section>
        </MergedCard>

        {/* Activity History Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderTop}>
              <View style={styles.cardTitleContainer}>
                <View style={styles.cardTitleIconWrapper}>
                  <ActivityHistoryIcon size={20} color="#0A84FF" />
                </View>
                <View style={styles.cardTitleTextWrapper}>
                  <Text style={styles.cardTitle}>Activity History</Text>
                </View>
              </View>
            </View>
            {recentActivity.length > 0 && (
              <Text style={styles.activitySubtitle}>
                Recently completed meditations
              </Text>
            )}
          </View>
          
          <View style={styles.activityContent}>
            {isLoadingActivity ? (
              <View style={styles.activityList}>
                <ShimmerActivityHistory />
              </View>
            ) : recentActivity.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#2C2C2E', marginBottom: 16, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, color: '#6B6B7B', fontWeight: '300' }}>--</Text>
                </View>
                <Text style={styles.emptyStateTitle}>No sessions yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Start your meditation journey today! Your completed sessions will appear here.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.activityListWrapper}>
                  <ScrollView
                    style={[
                      styles.activityListScroll,
                      { maxHeight: activityListMaxHeight },
                      hasScrollableOverflow && styles.activityListScrollWithIndicator
                    ]}
                    contentContainerStyle={[
                      styles.activityList,
                      hasScrollableOverflow && styles.activityListScrollableContent
                    ]}
                    showsVerticalScrollIndicator={hasScrollableOverflow}
                    nestedScrollEnabled
                    onScroll={handleActivityScroll}
                    scrollEventThrottle={16}
                  >
                    {recentActivity.map((activityItem, index) => {
                      const sessionData = activityItem.sessionId ? sessionsById[activityItem.sessionId] : undefined;
                      const moduleData =
                        (activityItem.moduleId && modulesById[activityItem.moduleId]) ||
                        (sessionData ? modulesById[sessionData.goal] : undefined);
                      const moduleTitle = moduleData?.title;
                      const moduleColor = moduleData?.color || '#007AFF';
                      const moduleInitial = moduleTitle?.trim().charAt(0)?.toUpperCase() || 'M';
                      const iconBackground = createDarkIconBackground(moduleColor);
                      const formattedDate = formatSessionDate(activityItem.date);
                      const sessionTitle = sessionData?.title || 'Meditation Session';
                      const truncatedTitle = truncateText(sessionTitle, 28);
                      const minutesCompleted = activityItem.minutesCompleted ?? 0;
                      const roundedMinutes = Math.round(minutesCompleted);
                      const durationLabel = minutesCompleted > 0 
                        ? `${roundedMinutes} min` 
                        : sessionData?.durationMin 
                          ? `${sessionData.durationMin} min` 
                          : '-- min';
                      const completionLabel = formattedDate ? `Completed ${formattedDate}` : 'Completion date unavailable';

                      return (
                        <View key={`${activityItem.id || activityItem.sessionId}-${activityItem.createdAt || activityItem.date}-${index}`} style={styles.activityItem}>
                          <View
                            style={[
                              styles.activityIcon,
                              { backgroundColor: iconBackground }
                            ]}
                          >
                            <Text style={[styles.activityIconText, { color: moduleColor }]}>
                              {moduleInitial}
                            </Text>
                          </View>
                          <View style={styles.activityInfo}>
                            <View style={styles.activityHeader}>
                              <Text
                                style={styles.activityTitle}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {truncatedTitle}
                              </Text>
                              <Text style={styles.activityDate}>
                                {completionLabel}
                              </Text>
                            </View>
                            <View style={styles.activityDetails}>
                              {moduleTitle ? (
                                <Text style={styles.activityMeta}>{moduleTitle}</Text>
                              ) : null}
                            </View>
                          </View>
                          <View
                            style={[
                              styles.durationBadge,
                              { backgroundColor: iconBackground }
                            ]}
                          >
                            <Text style={[styles.durationBadgeText, { color: moduleColor }]}>
                              {durationLabel}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                  {hasScrollableOverflow && (
                    <>
                      <LinearGradient
                        pointerEvents="none"
                        colors={['rgba(28,28,30,1)', 'rgba(28,28,30,0)']}
                        style={styles.scrollFadeTop}
                      />
                      <LinearGradient
                        pointerEvents="none"
                        colors={['rgba(28,28,30,0)', 'rgba(28,28,30,1)']}
                        style={styles.scrollFadeBottom}
                      />
                      <View pointerEvents="none" style={styles.scrollHintContainer}>
                        <Text
                          style={[
                            styles.scrollHintText,
                            !isScrollHintVisible && styles.scrollHintTextHidden
                          ]}
                        >
                          Scroll to see more
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </>
            )}
          </View>
        </View>

        {/* Emotional Feedback History Card */}
        <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderTop}>
            <View style={styles.cardTitleContainer}>
              <View style={styles.cardTitleIconWrapper}>
                <ChatWritingIcon size={22} color="#0A84FF" />
              </View>
              <View style={styles.cardTitleTextWrapper}>
                <Text style={styles.cardTitle}>Emotional Feedback History</Text>
              </View>
            </View>
            <TouchableOpacity
              ref={feedbackInfoButtonRef}
              style={[styles.infoButton, isFeedbackInfoActive && styles.infoButtonActive]}
              onPress={handleFeedbackInfoPress}
              activeOpacity={0.7}
            >
              <Text style={[styles.infoButtonText, isFeedbackInfoActive && styles.infoButtonTextActive]}>
                i
              </Text>
            </TouchableOpacity>
          </View>
          {sortedFeedbackHistory.length > 0 && (
            <Text style={styles.activitySubtitle}>
              Moments you captured during sessions
            </Text>
          )}
        </View>

          <View style={styles.activityContent}>
            {isLoadingFeedback ? (
              <View style={styles.activityList}>
                <ShimmerEmotionalFeedbackHistory />
              </View>
            ) : sortedFeedbackHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#2C2C2E', marginBottom: 16, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, color: '#6B6B7B', fontWeight: '300' }}>--</Text>
                </View>
                <Text style={styles.emptyStateTitle}>No feedback yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Share how each meditation makes you feel to see it here.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.activityListWrapper}>
                  <ScrollView
                    style={[
                      styles.activityListScroll,
                      { maxHeight: feedbackListMaxHeight },
                      hasFeedbackOverflow && styles.activityListScrollWithIndicator
                    ]}
                    contentContainerStyle={[
                      styles.activityList,
                      hasFeedbackOverflow && styles.activityListScrollableContent
                    ]}
                    showsVerticalScrollIndicator={hasFeedbackOverflow}
                    nestedScrollEnabled
                    onScroll={handleFeedbackScroll}
                    scrollEventThrottle={16}
                  >
                    {sortedFeedbackHistory.map((entry, index) => {
                      const sessionData = sessionsById[entry.sessionId];
                      const sessionTitle = sessionData?.title || 'Meditation Session';
                      const truncatedTitle = truncateText(sessionTitle, 28);
                      const feedbackLabel = entry.label as EmotionalFeedbackLabel;
                      const feedbackColor = feedbackColorMap[feedbackLabel] || theme.colors.primary;
                      const feedbackBackground = feedbackColor;
                      const formattedDate = formatSessionDate(entry.date) || 'Date unavailable';
                      const formattedTimestamp = formatTimestamp(entry.timestampSeconds);
                      const isRemoving = removingFeedbackIds.has(entry.id);

                      return (
                        <AnimatedFeedbackItem
                          key={`${entry.id}-${entry.timestampSeconds}-${index}`}
                          isRemoving={isRemoving}
                          onAnimationComplete={() => handleRemoveAnimationComplete(entry.id)}
                        >
                          <View style={styles.activityItem}>
                            <View
                              style={[
                                styles.activityIcon,
                                { backgroundColor: feedbackBackground, borderWidth: 0 }
                              ]}
                            />
                            <View style={styles.activityInfo}>
                              <View style={styles.activityHeader}>
                                <Text
                                  style={styles.activityTitle}
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                >
                                  {truncatedTitle}
                                </Text>
                                <Text style={styles.activityDate}>{formattedDate}</Text>
                              </View>
                              <View style={styles.feedbackDetailsRow}>
                                <Text
                                  style={[
                                    styles.feedbackLabelTag,
                                    {
                                      color: '#ffffff',
                                      backgroundColor: feedbackColor
                                    }
                                  ]}
                                >
                                  {feedbackLabel}
                                </Text>
                                <Text style={styles.activityMeta}>at {formattedTimestamp}</Text>
                              </View>
                            </View>
                            <TouchableOpacity
                              style={styles.deleteFeedbackButton}
                              onPress={() => handleRemoveEmotionalFeedback(entry.id)}
                              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                            >
                              <Text style={styles.deleteFeedbackButtonText}>×</Text>
                            </TouchableOpacity>
                          </View>
                        </AnimatedFeedbackItem>
                      );
                    })}
                  </ScrollView>
                  {hasFeedbackOverflow && (
                    <>
                      <LinearGradient
                        pointerEvents="none"
                        colors={['rgba(28,28,30,1)', 'rgba(28,28,30,0)']}
                        style={styles.scrollFadeTop}
                      />
                      <LinearGradient
                        pointerEvents="none"
                        colors={['rgba(28,28,30,0)', 'rgba(28,28,30,1)']}
                        style={styles.scrollFadeBottom}
                      />
                      <View pointerEvents="none" style={styles.scrollHintContainer}>
                        <Text
                          style={[
                            styles.scrollHintText,
                            !isFeedbackScrollHintVisible && styles.scrollHintTextHidden
                          ]}
                        >
                          Scroll to see more
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </>
            )}
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      <InfoBox
        isVisible={showFeedbackInfoBox}
        onClose={handleCloseFeedbackInfoBox}
        title="Emotional Feedback"
        content="Warning: deleting feedback may change the suggestion algorithm."
        position={feedbackInfoPosition}
      />
      {/* Remove Feedback Toast */}
      {showRemoveFeedbackToast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: toastAnim,
              transform: [{
                translateY: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.toastText}>
            Removed emotional feedback
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  ...theme.health,
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1001,
  },
  stickyHeader: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 5,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollContent: {
    paddingTop: 120,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileHeaderCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  profileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 20,
    paddingRight: 8,
  },
  profilePictureWrapper: {
    marginRight: 12,
  },
  profileInitialContainer: {
    width: 110,
    height: 110,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#2C2C2E',
  },
  profileInitialText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#F2F2F7',
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: 0,
    paddingLeft: 8,
  },
  statsSection: {
    backgroundColor: '#1C1C1E',
  },
  mergedSectionTop: {
    paddingTop: 0,
  },
  mergedSectionReducedBottomPadding: {
    paddingBottom: 8,
  },
  mergedSectionAfterDivider: {
    paddingTop: 0,
  },
  mergedSectionIncreasedTopPadding: {
    paddingTop: 8,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F2F2F7',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subscriptionContainer: {
    marginBottom: 5,
    marginLeft: -16,
    marginRight: 0,
    alignSelf: 'flex-start',
  },
  subscriptionContainerPremium: {
    marginTop: 5,
    marginBottom: 5,
    marginLeft: -25,
    marginRight: 0,
  },
  upgradeButton: {
    backgroundColor: '#0A84FF',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  upgradeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelMessageContainer: {
    marginTop: 8,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  cancelMessageText: {
    fontSize: 13,
    color: '#6B6B7B',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  profileSubtitle: {
    fontSize: 15,
    color: '#6B6B7B',
    fontWeight: '400',
    lineHeight: 20,
  },
  profileContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    alignItems: 'center',
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitleIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleTextWrapper: {
    justifyContent: 'center',
    marginLeft: 6,
    paddingTop: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  shareContent: {
    paddingTop: 0,
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  shareSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
    marginBottom: 0,
    textAlign: 'left',
  },
  stepsList: {
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#F2F2F7',
    fontWeight: '400',
  },
  referralSection: {
    marginBottom: 16,
  },
  referralLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A0A0B0',
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  referralLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  referralLink: {
    flex: 1,
    fontSize: 14,
    color: '#6B6B7B',
    fontWeight: '400',
    fontFamily: 'Courier',
  },
  copyButton: {
    backgroundColor: '#0A84FF',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#0A84FF',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  inviteButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  inviteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F2F2F7',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B6B7B',
    fontWeight: '500',
    textAlign: 'center',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },
  statDivider: {
    width: 0.5,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 20,
  },
  activityContent: {
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  activitySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
    marginTop: 0,
    marginBottom: 0,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#F2F2F7',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 15,
    color: '#6B6B7B',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  activityList: {
    gap: 8,
  },
  activityListScrollableContent: {
    paddingBottom: 36,
  },
  activityListScroll: {
    width: '100%',
    marginRight: -4,
  },
  activityListScrollWithIndicator: {
    paddingRight: 8,
    marginRight: -12,
  },
  activityListWrapper: {
    position: 'relative',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    padding: 12,
    overflow: 'hidden',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 0,
  },
  activityIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  activityInfo: {
    flex: 1,
    paddingRight: 8,
  },
  activityHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F2F2F7',
  },
  activityDate: {
    fontSize: 13,
    color: '#6B6B7B',
    fontWeight: '400',
    marginTop: 2,
  },
  activityDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  activityMeta: {
    fontSize: 13,
    color: '#6B6B7B',
    fontWeight: '400',
  },
  durationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
    alignSelf: 'flex-start',
  },
  durationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  feedbackDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackLabelTag: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    color: '#ffffff',
  },
  deleteFeedbackButton: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteFeedbackButtonText: {
    fontSize: 18,
    color: '#6B6B7B',
    fontWeight: '600',
  },
  scrollFadeTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 24,
  },
  scrollFadeBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 32,
    height: 32,
  },
  scrollHintContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1C1C1E',
  },
  scrollHintText: {
    fontSize: 11,
    color: '#6B6B7B',
    fontWeight: '500',
  },
  scrollHintTextHidden: {
    opacity: 0,
  },
  infoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0A0B0',
  },
  infoButtonActive: {
    backgroundColor: '#0A84FF',
  },
  infoButtonTextActive: {
    color: '#ffffff',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
}); 