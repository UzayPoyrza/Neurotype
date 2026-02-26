import { create } from 'zustand';
import { Appearance } from 'react-native';
import { UserProgress, FilterState, SessionDelta, Session, EmotionalFeedbackEntry } from '../types';
import { mentalHealthModules } from '../data/modules';
import { toggleLikedSession as toggleLikedSessionDB, getLikedSessionIds } from '../services/likedService';
import { getCompletedSessionsByDateRange, markSessionCompleted, isSessionCompleted, CompletedSession, calculateUserStreak, getUserCompletedSessions } from '../services/progressService';
import { getSessionModules } from '../services/sessionService';
import { getLocalDateString, parseLocalDate } from '../utils/dateUtils';

// Helper function to get category from moduleId
const getCategoryFromModuleId = (moduleId: string | undefined): 'disorder' | 'wellness' | 'skill' | 'winddown' => {
  if (!moduleId) return 'wellness';
  const module = mentalHealthModules.find(m => m.id === moduleId);
  return module?.category || 'wellness';
};

// Helper function to create subtle background colors from module colors
export const createSubtleBackground = (moduleColor: string): string => {
  // Dark mode: create a very subtle dark tint from the module color
  const hex = moduleColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Mix with deep navy-black base (#0A0A0F) (95% base, 5% module color)
  const baseR = 10, baseG = 10, baseB = 15;
  const mixedR = Math.round(baseR * 0.95 + r * 0.05);
  const mixedG = Math.round(baseG * 0.95 + g * 0.05);
  const mixedB = Math.round(baseB * 0.95 + b * 0.05);

  return `rgb(${mixedR}, ${mixedG}, ${mixedB})`;
};

// Create a muted dark tint for icon backgrounds on dark cards
export const createDarkIconBackground = (moduleColor: string): string => {
  const hex = moduleColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // 80% dark base (#2A2A36) + 20% module color
  const baseR = 42, baseG = 42, baseB = 54;
  const mixedR = Math.round(baseR * 0.80 + r * 0.20);
  const mixedG = Math.round(baseG * 0.80 + g * 0.20);
  const mixedB = Math.round(baseB * 0.80 + b * 0.20);

  return `rgb(${mixedR}, ${mixedG}, ${mixedB})`;
};

// Helper function to convert RGB to HSL
const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
};

// Helper function to convert HSL to RGB
const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

// Helper function to create subtle completion background color using color theory
// Uses a very neutral, desaturated approach that works with all module colors
// For red backgrounds, uses a neutral warm tone; for others, a very subtle cool-neutral
export const createCompletionBackground = (moduleColor: string, moduleBackground: string): string => {
  // Convert module color hex to RGB
  const hex = moduleColor.replace('#', '');
  const moduleR = parseInt(hex.substr(0, 2), 16);
  const moduleG = parseInt(hex.substr(2, 2), 16);
  const moduleB = parseInt(hex.substr(4, 2), 16);
  
  // Convert to HSL for easier manipulation
  const [h, s, l] = rgbToHsl(moduleR, moduleG, moduleB);
  
  // Determine if this is a warm color (red/orange) that needs special handling
  const isWarmColor = h >= 0 && h <= 60 || h >= 300 && h <= 360; // Red, orange, yellow, magenta
  
  let adjustedHue: number;
  let adjustedSaturation: number;
  
  if (isWarmColor) {
    // For warm colors (like red), use a very neutral warm beige tone
    // This avoids the red-green complementary clash
    // Use a neutral warm hue around 30-40 degrees (warm beige/cream)
    adjustedHue = 35;
    // Very low saturation for neutrality
    adjustedSaturation = 8;
  } else {
    // For cool colors, use a very desaturated neutral-cool tone
    // Slight shift toward a neutral cool gray-green (around 150-160 degrees)
    adjustedHue = 155;
    // Very low saturation for subtlety
    adjustedSaturation = 6;
  }
  
  // Very high lightness for subtlety (96-97%)
  const adjustedLightness = 96.5;
  
  // Convert back to RGB
  const [r, g, b] = hslToRgb(adjustedHue, adjustedSaturation, adjustedLightness);
  
  return `rgb(${r}, ${g}, ${b})`;
};

// Helper function to create completion button color (slightly darker/more saturated)
export const createCompletionButtonColor = (moduleColor: string): string => {
  const hex = moduleColor.replace('#', '');
  const moduleR = parseInt(hex.substr(0, 2), 16);
  const moduleG = parseInt(hex.substr(2, 2), 16);
  const moduleB = parseInt(hex.substr(4, 2), 16);
  
  const [h, s, l] = rgbToHsl(moduleR, moduleG, moduleB);
  
  // Shift toward green more (30% shift) for button
  const greenHue = 120;
  const adjustedHue = h + (greenHue - h) * 0.30;
  
  // More saturated for button
  const adjustedSaturation = Math.min(100, s * 1.3);
  
  // Medium lightness for button visibility
  const adjustedLightness = Math.min(85, l * 1.2 + 15);
  
  const [r, g, b] = hslToRgb(adjustedHue, adjustedSaturation, adjustedLightness);
  
  return `rgb(${r}, ${g}, ${b})`;
};

// Light mode: create a very subtle light tint from the module color
export const createSubtleBackgroundLight = (moduleColor: string): string => {
  const hex = moduleColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Mix with light base (#f2f1f6) — 95% base, 5% module color
  const baseR = 242, baseG = 241, baseB = 246;
  const mixedR = Math.round(baseR * 0.95 + r * 0.05);
  const mixedG = Math.round(baseG * 0.95 + g * 0.05);
  const mixedB = Math.round(baseB * 0.95 + b * 0.05);

  return `rgb(${mixedR}, ${mixedG}, ${mixedB})`;
};

// Light mode: muted tint for icon backgrounds on white cards
export const createLightIconBackground = (moduleColor: string): string => {
  const hex = moduleColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // 85% white base + 15% module color
  const baseR = 255, baseG = 255, baseB = 255;
  const mixedR = Math.round(baseR * 0.85 + r * 0.15);
  const mixedG = Math.round(baseG * 0.85 + g * 0.15);
  const mixedB = Math.round(baseB * 0.85 + b * 0.15);

  return `rgb(${mixedR}, ${mixedG}, ${mixedB})`;
};

// Pre-calculate all module background colors for instant switching
export const prerenderedModuleBackgrounds: Record<string, string> = {};
export const prerenderedLightModuleBackgrounds: Record<string, string> = {};
mentalHealthModules.forEach(module => {
  prerenderedModuleBackgrounds[module.id] = createSubtleBackground(module.color);
  prerenderedLightModuleBackgrounds[module.id] = createSubtleBackgroundLight(module.color);
});

// Cache entry for completed sessions
export interface CompletedSessionCacheEntry {
  id: string;
  sessionId: string;
  moduleId?: string;
  date: string;
  minutesCompleted: number;
  createdAt: string;
}

const buildInitialStoreData = () => {
  return {
    userProgress: {
      streak: 0,
      sessionDeltas: [],
      techniqueEffectiveness: [
        { techniqueId: 'breathing', techniqueName: 'Breathing Exercises', effectiveness: 85 },
        { techniqueId: 'body_scan', techniqueName: 'Body Scan', effectiveness: 78 },
        { techniqueId: 'loving_kindness', techniqueName: 'Loving Kindness', effectiveness: 72 },
        { techniqueId: 'mindfulness', techniqueName: 'Mindfulness Meditation', effectiveness: 65 },
        { techniqueId: 'progressive_relaxation', techniqueName: 'Progressive Relaxation', effectiveness: 58 },
        { techniqueId: 'visualization', techniqueName: 'Guided Visualization', effectiveness: 45 },
        { techniqueId: 'mantra', techniqueName: 'Mantra Meditation', effectiveness: null },
        { techniqueId: 'walking', techniqueName: 'Walking Meditation', effectiveness: null },
        { techniqueId: 'yoga', techniqueName: 'Yoga Nidra', effectiveness: null },
      ],
    },
    userFirstName: 'Ava',
    filters: {
      modality: 'all',
      goal: 'all',
    } as FilterState,
    reminderEnabled: false,
    darkThemeEnabled: Appearance.getColorScheme() !== 'light',
    profileIcon: '👤',
    subscriptionType: 'premium' as const,
    subscriptionCancelAt: null as string | null,
    subscriptionEndDate: null as string | null,
    subscriptionIsLifetime: false,
    activeSession: null,
    activeModuleId: null,
    recentModuleIds: [] as string[],
    globalBackgroundColor: '#0A0A0F',
    globalBackgroundColorLight: '#f2f1f6',
    currentScreen: 'today' as const,
    todayModuleId: 'anxiety',
    likedSessionIds: [] as string[],
    isTransitioning: false,
    emotionalFeedbackHistory: [] as EmotionalFeedbackEntry[],
    // Start with empty cache - will be populated from database on app open
    completedTodaySessions: {},
    isLoggedIn: false,
    hasCompletedOnboarding: false,
    sessionCache: {} as Record<string, Session>,
    userId: null as string | null,
    completedSessionsCache: [] as CompletedSessionCacheEntry[],
    // Sessions cache for ProgressScreen
    sessionsCache: {
      total: 0,
      thisWeek: 0,
      thisMonth: 0,
    },
    // Calendar cache for ProgressScreen
    calendarCache: [] as CompletedSession[],
  };
};

interface AppState {
  userProgress: UserProgress;
  userFirstName: string;
  filters: FilterState;
  reminderEnabled: boolean;
  darkThemeEnabled: boolean;
  profileIcon: string;
  subscriptionType: 'basic' | 'premium';
  subscriptionCancelAt: string | null;
  subscriptionEndDate: string | null;
  subscriptionIsLifetime: boolean;
  activeSession: Session | null;
  activeModuleId: string | null;
  recentModuleIds: string[];
  globalBackgroundColor: string;
  globalBackgroundColorLight: string;
  currentScreen: 'today' | 'explore' | 'progress' | 'profile' | 'settings' | 'module-detail';
  todayModuleId: string | null;
  likedSessionIds: string[];
  isTransitioning: boolean;
  emotionalFeedbackHistory: EmotionalFeedbackEntry[];
  completedTodaySessions: Record<string, string[]>; // Key: "moduleId-date", Value: array of session IDs
  isLoggedIn: boolean;
  hasCompletedOnboarding: boolean;
  sessionCache: Record<string, Session>;
  userId: string | null;
  completedSessionsCache: CompletedSessionCacheEntry[];
  sessionsCache: { total: number; thisWeek: number; thisMonth: number };
  calendarCache: CompletedSession[];
  setUserId: (userId: string | null) => void;
  addSessionDelta: (delta: SessionDelta) => void;
  setFilters: (filters: FilterState) => void;
  toggleReminder: () => void;
  toggleDarkTheme: () => void;
  setDarkThemeEnabled: (enabled: boolean) => void;
  setUserFirstName: (name: string) => void;
  setProfileIcon: (icon: string) => void;
  setSubscriptionType: (type: 'basic' | 'premium') => void;
  setSubscriptionCancelAt: (cancelAt: string | null) => void;
  setSubscriptionEndDate: (endDate: string | null) => void;
  setSubscriptionIsLifetime: (isLifetime: boolean) => void;
  setActiveSession: (session: Session | null) => void;
  setActiveModuleId: (moduleId: string | null) => void;
  addRecentModule: (moduleId: string) => void;
  setGlobalBackgroundColor: (color: string, lightColor?: string) => void;
  setCurrentScreen: (screen: 'today' | 'explore' | 'progress' | 'profile' | 'settings' | 'module-detail') => void;
  setTodayModuleId: (moduleId: string | null) => void;
  toggleLikedSession: (sessionId: string) => Promise<void>;
  isSessionLiked: (sessionId: string) => boolean;
  syncLikedSessionsFromDatabase: (userId: string) => Promise<void>;
  setIsTransitioning: (isTransitioning: boolean) => void;
  addEmotionalFeedbackEntry: (entry: EmotionalFeedbackEntry) => void;
  removeEmotionalFeedbackEntry: (entryId: string) => void;
  markSessionCompletedToday: (moduleId: string, sessionId: string, date?: string, minutesCompleted?: number) => Promise<{ wasUpdate: boolean }>;
  isSessionCompletedToday: (moduleId: string, sessionId: string, date?: string) => boolean;
  syncTodayCompletedSessionsFromDatabase: (userId: string) => Promise<void>;
  syncAllCompletedSessionsFromDatabase: (userId: string) => Promise<void>;
  cleanupOldCompletedSessions: () => void;
  cacheSessions: (sessions: Session[]) => void;
  getCachedSession: (sessionId: string) => Session | null;
  addCompletedSessionToCache: (entry: CompletedSessionCacheEntry) => void;
  removeDuplicateCacheEntries: (dbEntries: Array<{ session_id: string; created_at: string }>) => void;
  incrementSessionsCache: () => void;
  decrementSessionsCache: () => void;
  addToCalendarCache: (entry: CompletedSession) => void;
  clearSessionsCache: () => void;
  clearCalendarCache: () => void;
  clearEmotionalFeedbackCache: () => void;
  setSessionsCache: (sessions: { total: number; thisWeek: number; thisMonth: number }) => void;
  setCalendarCache: (sessions: CompletedSession[]) => void;
  setEmotionalFeedbackCache: (feedback: EmotionalFeedbackEntry[]) => void;
  resetAppData: () => void;
  logout: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  ...buildInitialStoreData(),

  addSessionDelta: (delta: SessionDelta) => 
    set((state) => ({
      userProgress: {
        ...state.userProgress,
        sessionDeltas: [...state.userProgress.sessionDeltas, delta],
        streak: state.userProgress.streak + 1
      }
    })),
    
  setFilters: (filters: FilterState) => 
    set({ filters }),
    
  toggleReminder: () => 
    set((state) => ({ reminderEnabled: !state.reminderEnabled })),
    
  toggleDarkTheme: () =>
    set((state) => ({ darkThemeEnabled: !state.darkThemeEnabled })),

  setDarkThemeEnabled: (enabled: boolean) =>
    set({ darkThemeEnabled: enabled }),

  setUserFirstName: (name: string) =>
    set({ userFirstName: name }),
    
  setProfileIcon: (icon: string) => 
    set({ profileIcon: icon }),
    
  setSubscriptionType: (type: 'basic' | 'premium') => 
    set({ subscriptionType: type }),
    
  setSubscriptionCancelAt: (cancelAt: string | null) =>
    set({ subscriptionCancelAt: cancelAt }),
    
  setSubscriptionEndDate: (endDate: string | null) =>
    set({ subscriptionEndDate: endDate }),
    
  setSubscriptionIsLifetime: (isLifetime: boolean) =>
    set({ subscriptionIsLifetime: isLifetime }),
    
  setActiveSession: (session: Session | null) => 
    set({ activeSession: session }),
    
  setActiveModuleId: (moduleId: string | null) => 
    set({ activeModuleId: moduleId }),
    
  addRecentModule: (moduleId: string) => 
    set((state) => ({
      recentModuleIds: [
        moduleId,
        ...state.recentModuleIds.filter(id => id !== moduleId)
      ].slice(0, 10) // Keep only last 10 recent modules
    })),
    
  setGlobalBackgroundColor: (color: string, lightColor?: string) =>
    set({ globalBackgroundColor: color, globalBackgroundColorLight: lightColor || '#f2f1f6' }),
    
  setCurrentScreen: (screen: 'today' | 'explore' | 'progress' | 'profile' | 'settings' | 'module-detail') => 
    set({ currentScreen: screen }),
    
  setTodayModuleId: (moduleId: string | null) => 
    set({ todayModuleId: moduleId }),
    
  toggleLikedSession: async (sessionId: string) => {
    const state = get();
    const userId = state.userId;
    
    console.log('👆 Like button pressed for session:', sessionId);
    
    if (!userId) {
      console.warn('⚠️ Cannot save like to database: user ID not set');
      // Still update local state for immediate UI feedback
      set((state) => ({
        likedSessionIds: state.likedSessionIds.includes(sessionId)
          ? state.likedSessionIds.filter(id => id !== sessionId)
          : [...state.likedSessionIds, sessionId]
      }));
      return;
    }

    const isCurrentlyLiked = state.likedSessionIds.includes(sessionId);
    console.log('📊 Current like status:', isCurrentlyLiked ? 'liked' : 'not liked');
    
    // Optimistically update UI first
    set((state) => ({
      likedSessionIds: isCurrentlyLiked
        ? state.likedSessionIds.filter(id => id !== sessionId)
        : [...state.likedSessionIds, sessionId]
    }));

    // Then save to database
    console.log('💾 Saving like to database...');
    const result = await toggleLikedSessionDB(userId, sessionId);
    
    if (result.success) {
      console.log('✅ Like saved to database successfully!');
      console.log('✅ New like status:', result.isLiked ? 'liked' : 'unliked');
    } else {
      console.error('❌ Failed to save like to database:', result.error);
      // Revert optimistic update on error
      set((state) => ({
        likedSessionIds: isCurrentlyLiked
          ? [...state.likedSessionIds, sessionId]
          : state.likedSessionIds.filter(id => id !== sessionId)
      }));
    }
  },
    
  isSessionLiked: (sessionId: string): boolean => {
    const state = get();
    return state.likedSessionIds.includes(sessionId);
  },

  syncLikedSessionsFromDatabase: async (userId: string) => {
    try {
      console.log('💙 [Store] Syncing liked sessions from database...');
      const likedIds = await getLikedSessionIds(userId);
      set({ likedSessionIds: likedIds });
      console.log('✅ [Store] Liked sessions synced:', likedIds.length, 'sessions');
    } catch (error) {
      console.error('❌ [Store] Error syncing liked sessions:', error);
    }
  },

  setIsTransitioning: (isTransitioning: boolean) => 
    set({ isTransitioning }),

  addEmotionalFeedbackEntry: (entry: EmotionalFeedbackEntry) =>
    set((state) => ({
      emotionalFeedbackHistory: [entry, ...state.emotionalFeedbackHistory]
    })),

  removeEmotionalFeedbackEntry: (entryId: string) =>
    set((state) => ({
      emotionalFeedbackHistory: state.emotionalFeedbackHistory.filter(entry => entry.id !== entryId)
    })),

  cleanupOldCompletedSessions: () => {
    const today = getLocalDateString();
    set((state) => {
      const cleaned: Record<string, string[]> = {};
      let hasChanges = false;
      
      Object.keys(state.completedTodaySessions).forEach((key) => {
        // Extract date from key (format: "moduleId-YYYY-MM-DD")
        // Handle keys like "anxiety-2025-01-15" or "module-id-2025-01-15"
        const parts = key.split('-');
        if (parts.length >= 4) {
          // Reconstruct date from last 3 parts (YYYY-MM-DD)
          const sessionDate = `${parts[parts.length - 3]}-${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
          if (sessionDate === today) {
            cleaned[key] = state.completedTodaySessions[key];
          } else {
            hasChanges = true; // Mark that we're removing old entries
          }
        } else {
          // If key format is unexpected, keep it to be safe
          cleaned[key] = state.completedTodaySessions[key];
        }
      });
      
      if (hasChanges) {
        console.log('🧹 [Store] Cleaned up old completed session entries, keeping only today:', today);
        return { completedTodaySessions: cleaned };
      }
      return state;
    });
  },

  syncTodayCompletedSessionsFromDatabase: async (userId: string) => {
    try {
      const today = getLocalDateString();
      console.log('🔄 [Store] Syncing today\'s completed sessions from database for date:', today);
      
      // Clear existing cache first
      set({ completedTodaySessions: {} });
      
      // Fetch all completed sessions for today from database
      const completedSessions = await getCompletedSessionsByDateRange(userId, today, today);
      console.log('📊 [Store] Found', completedSessions.length, 'completed sessions for today in database');
      
      // Group by module and populate cache
      // For each completed session, add it to ALL modules it belongs to (so checkmarks show across modules)
      const cache: Record<string, string[]> = {};
      
      for (const session of completedSessions) {
        // Get all modules this session belongs to
        const sessionModules = await getSessionModules(session.session_id);
        
        // If no modules found, use the context_module from the completion record
        const modulesToAdd = sessionModules.length > 0 
          ? sessionModules 
          : [session.context_module || 'anxiety'];
        
        // Add session to cache for each module it belongs to
        modulesToAdd.forEach((moduleId) => {
          const key = `${moduleId}-${today}`;
          if (!cache[key]) {
            cache[key] = [];
          }
          if (!cache[key].includes(session.session_id)) {
            cache[key].push(session.session_id);
          }
        });
      }
      
      console.log('✅ [Store] Populated cache with', Object.keys(cache).length, 'module entries');
      set({ completedTodaySessions: cache });
    } catch (error) {
      console.error('❌ [Store] Error syncing completed sessions from database:', error);
      // On error, keep empty cache
      set({ completedTodaySessions: {} });
    }
  },

  syncAllCompletedSessionsFromDatabase: async (userId: string) => {
    try {
      console.log('📊 [Store] Syncing all completed sessions from database...');
      const allSessions = await getUserCompletedSessions(userId);
      console.log('📊 [Store] Found', allSessions.length, 'total completed sessions');

      // Calculate date boundaries
      const today = new Date();
      const todayStr = getLocalDateString();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = getLocalDateString(weekAgo);
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      // Calculate stats
      const total = allSessions.length;
      const thisWeek = allSessions.filter(session =>
        session.completed_date >= weekAgoStr && session.completed_date <= todayStr
      ).length;
      const thisMonth = allSessions.filter(session => {
        const sessionDate = parseLocalDate(session.completed_date);
        return sessionDate.getFullYear() === currentYear && sessionDate.getMonth() === currentMonth;
      }).length;

      // Update caches
      set({
        sessionsCache: { total, thisWeek, thisMonth },
        calendarCache: allSessions
      });
      console.log('✅ [Store] Sessions cache updated:', { total, thisWeek, thisMonth });
    } catch (error) {
      console.error('❌ [Store] Error syncing all completed sessions:', error);
    }
  },

  markSessionCompletedToday: async (moduleId: string, sessionId: string, date?: string, minutesCompleted: number = 0): Promise<{ wasUpdate: boolean }> => {
    const today = date || getLocalDateString();
    const state = get();
    const userId = state.userId;
    const sessionIdClean = sessionId.replace('-today', '');
    
    // Get all modules this session belongs to, so we can add it to all relevant module caches
    let sessionModules: string[] = [];
    try {
      sessionModules = await getSessionModules(sessionIdClean);
      // If no modules found, use the current module
      if (sessionModules.length === 0) {
        sessionModules = [moduleId];
      }
    } catch (error) {
      console.error('❌ [Store] Error fetching session modules, using current module only:', error);
      sessionModules = [moduleId];
    }
    
    // Immediately add to cache for ALL modules this session belongs to (optimistic update)
    // This allows checkmark to show in all relevant modules immediately
    set((state) => {
      const updatedCache = { ...state.completedTodaySessions };
      let hasChanges = false;

      sessionModules.forEach((modId) => {
        const moduleKey = `${modId}-${today}`;
        const completed = updatedCache[moduleKey] || [];
        if (!completed.includes(sessionIdClean) && !completed.includes(sessionId)) {
          updatedCache[moduleKey] = [...completed, sessionIdClean];
          hasChanges = true;
        }
      });

      return hasChanges ? { completedTodaySessions: updatedCache } : state;
    });

    // Optimistically update calendar cache and sessions cache for immediate UI feedback
    // This ensures activity history updates right after rating, before DB call completes
    if (userId) {
      const calendarEntry: CompletedSession = {
        id: `temp-${Date.now()}`,
        user_id: userId,
        session_id: sessionIdClean,
        context_module: moduleId || undefined,
        completed_date: today,
        minutes_completed: minutesCompleted,
        created_at: new Date().toISOString(),
      };
      get().addToCalendarCache(calendarEntry);
      get().incrementSessionsCache();
      console.log('✅ [Store] Calendar and sessions cache updated optimistically');
    }

    // Always save to database - markSessionCompleted handles update/create logic:
    // - Same session + same context_module + same day: UPDATE existing entry
    // - Different day OR different context_module: CREATE new entry
    let wasUpdate = false;
    if (userId) {
      try {
        const result = await markSessionCompleted(userId, sessionIdClean, minutesCompleted, moduleId, today);
        if (!result.success) {
          console.error('❌ [Store] Failed to save completion to database:', result.error);
          // Optionally remove from cache on error, but for now keep it for better UX
        } else {
          wasUpdate = result.wasUpdate || false;
          console.log('✅ [Store] Session completion saved/updated to database', { wasUpdate });

          // If this was an update (not a new entry), decrement the optimistic increment
          if (wasUpdate) {
            get().decrementSessionsCache();
            console.log('🔄 [Store] Decremented sessions cache (was an update, not new entry)');
          }

          // Recalculate streak after session completion (only for new entries)
          if (!wasUpdate) {
            calculateUserStreak(userId).then((newStreak) => {
              set((state) => ({
                userProgress: {
                  ...state.userProgress,
                  streak: newStreak,
                },
              }));
              console.log(`🔥 [Store] Streak updated after session completion: ${newStreak} days`);
            }).catch((error) => {
              console.error('❌ [Store] Error updating streak:', error);
            });
          }
        }
      } catch (error) {
        console.error('❌ [Store] Error saving completion to database:', error);
      }
    } else {
      console.warn('⚠️ [Store] No userId, cannot save to database');
    }
    
    return { wasUpdate };
  },

  isSessionCompletedToday: (moduleId: string, sessionId: string, date?: string): boolean => {
    const today = date || getLocalDateString();
    const state = get();
    
    // Check ALL module keys for today (session might be completed in a different module)
    // This allows checkmarks to show across all modules that include the session
    const sessionIdClean = sessionId.replace('-today', '');
    const allModuleKeys = Object.keys(state.completedTodaySessions);
    
    for (const key of allModuleKeys) {
      // Check if this key is for today
      const parts = key.split('-');
      if (parts.length >= 4) {
        const sessionDate = `${parts[parts.length - 3]}-${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
        if (sessionDate === today) {
          const completed = state.completedTodaySessions[key] || [];
          if (completed.includes(sessionId) || completed.includes(sessionIdClean)) {
            return true;
          }
        }
      }
    }
    
    return false;
  },

  cacheSessions: (sessions: Session[]) =>
    set((state) => {
      const newCache = { ...state.sessionCache };
      sessions.forEach((session) => {
        newCache[session.id] = session;
      });
      return { sessionCache: newCache };
    }),

  getCachedSession: (sessionId: string): Session | null => {
    const state = get();
    return state.sessionCache[sessionId] || null;
  },

  addCompletedSessionToCache: (entry: CompletedSessionCacheEntry) =>
    set((state) => {
      // Clean sessionId (remove -today suffix if present) for comparison
      const cleanSessionId = entry.sessionId.replace('-today', '');

      // Check if exact same session + date exists (for replacement)
      const isSameSession = (existingEntry: CompletedSessionCacheEntry): boolean => {
        const existingCleanId = existingEntry.sessionId.replace('-today', '');
        return existingCleanId === cleanSessionId && existingEntry.date === entry.date;
      };

      // Remove existing entry if same session + date (to replace with updated timestamp)
      const filteredCache = state.completedSessionsCache.filter(
        existingEntry => !isSameSession(existingEntry)
      );

      // Add new entry at the beginning
      const newCache = [entry, ...filteredCache].slice(0, 50);

      const wasReplacement = state.completedSessionsCache.length > filteredCache.length;
      if (wasReplacement) {
        console.log(`🔄 [Store] Replaced entry for session ${cleanSessionId} on ${entry.date} (updated timestamp)`);
      } else {
        console.log(`➕ [Store] Added new entry for session ${cleanSessionId} on ${entry.date}`);
      }

      return { completedSessionsCache: newCache };
    }),

  removeDuplicateCacheEntries: (dbEntries: Array<{ session_id: string; created_at: string }>) =>
    set((state) => {
      // Create a set of DB entry keys for fast lookup
      const dbKeys = new Set(
        dbEntries.map(e => `${e.session_id}-${e.created_at}`)
      );
      
      // Remove cache entries that match DB entries
      const filteredCache = state.completedSessionsCache.filter(entry => {
        const cacheKey = `${entry.sessionId}-${entry.createdAt}`;
        return !dbKeys.has(cacheKey);
      });
      
      console.log(`🧹 [Store] Removed ${state.completedSessionsCache.length - filteredCache.length} duplicate cache entries`);
      
      return { completedSessionsCache: filteredCache };
    }),

  incrementSessionsCache: () =>
    set((state) => {
      const today = new Date();
      const todayStr = getLocalDateString(today);

      // Calculate this week (last 7 days)
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      const weekAgoStr = getLocalDateString(weekAgo);
      
      // Calculate this month
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      
      // Increment total
      const newTotal = state.sessionsCache.total + 1;
      
      // Check if today is within this week
      const isThisWeek = todayStr >= weekAgoStr;
      const newThisWeek = isThisWeek ? state.sessionsCache.thisWeek + 1 : state.sessionsCache.thisWeek;
      
      // Check if today is within this month
      const isThisMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
      const newThisMonth = isThisMonth ? state.sessionsCache.thisMonth + 1 : state.sessionsCache.thisMonth;
      
      console.log(`📊 [Store] Incremented sessions cache: total=${newTotal}, thisWeek=${newThisWeek}, thisMonth=${newThisMonth}`);
      
      return {
        sessionsCache: {
          total: newTotal,
          thisWeek: newThisWeek,
          thisMonth: newThisMonth,
        },
      };
    }),

  decrementSessionsCache: () =>
    set((state) => {
      const today = new Date();
      const todayStr = getLocalDateString(today);

      // Calculate this week (last 7 days)
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      const weekAgoStr = getLocalDateString(weekAgo);

      // Calculate this month
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      // Decrement total (don't go below 0)
      const newTotal = Math.max(0, state.sessionsCache.total - 1);

      // Check if today is within this week
      const isThisWeek = todayStr >= weekAgoStr;
      const newThisWeek = isThisWeek ? Math.max(0, state.sessionsCache.thisWeek - 1) : state.sessionsCache.thisWeek;

      // Check if today is within this month
      const isThisMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
      const newThisMonth = isThisMonth ? Math.max(0, state.sessionsCache.thisMonth - 1) : state.sessionsCache.thisMonth;

      console.log(`📊 [Store] Decremented sessions cache: total=${newTotal}, thisWeek=${newThisWeek}, thisMonth=${newThisMonth}`);

      return {
        sessionsCache: {
          total: newTotal,
          thisWeek: newThisWeek,
          thisMonth: newThisMonth,
        },
      };
    }),

  addToCalendarCache: (entry: CompletedSession) =>
    set((state) => {
      // Check if exact same session + date exists (for replacement)
      const isSameSession = (existingEntry: CompletedSession): boolean => {
        return existingEntry.session_id === entry.session_id &&
               existingEntry.completed_date === entry.completed_date;
      };

      // Remove existing entry if same session + date (to replace with updated timestamp)
      const filteredCache = state.calendarCache.filter(
        existingEntry => !isSameSession(existingEntry)
      );

      // Add new entry at the beginning
      const newCache = [entry, ...filteredCache];

      const wasReplacement = state.calendarCache.length > filteredCache.length;
      if (wasReplacement) {
        console.log(`🔄 [Store] Replaced calendar entry for session ${entry.session_id} on ${entry.completed_date}`);
      } else {
        console.log(`➕ [Store] Added new calendar entry for session ${entry.session_id} on ${entry.completed_date}`);
      }

      return { calendarCache: newCache };
    }),

  clearSessionsCache: () =>
    set(() => {
      console.log('🧹 [Store] Clearing sessions cache');
      return {
        sessionsCache: {
          total: 0,
          thisWeek: 0,
          thisMonth: 0,
        },
      };
    }),

  clearCalendarCache: () =>
    set(() => {
      console.log('🧹 [Store] Clearing calendar cache');
      return { calendarCache: [] };
    }),

  setSessionsCache: (sessions: { total: number; thisWeek: number; thisMonth: number }) =>
    set(() => {
      console.log(`📊 [Store] Setting sessions cache: total=${sessions.total}, thisWeek=${sessions.thisWeek}, thisMonth=${sessions.thisMonth}`);
      return { sessionsCache: sessions };
    }),

  setCalendarCache: (sessions: CompletedSession[]) =>
    set(() => {
      console.log(`📅 [Store] Setting calendar cache with ${sessions.length} entries`);
      return { calendarCache: sessions };
    }),

  clearEmotionalFeedbackCache: () =>
    set(() => {
      console.log('🧹 [Store] Clearing emotional feedback cache');
      return { emotionalFeedbackHistory: [] };
    }),

  setEmotionalFeedbackCache: (feedback: EmotionalFeedbackEntry[]) =>
    set(() => {
      console.log(`💭 [Store] Setting emotional feedback cache with ${feedback.length} entries`);
      return { emotionalFeedbackHistory: feedback };
    }),

  resetAppData: () => {
    const defaults = buildInitialStoreData();
    set((state) => ({
      ...defaults,
      currentScreen: state.currentScreen,
      hasCompletedOnboarding: state.hasCompletedOnboarding, // Preserve onboarding state
    }));
  },

  logout: () => {
    set({ 
      isLoggedIn: false,
      userId: null,
      hasCompletedOnboarding: false,
      emotionalFeedbackHistory: [] as EmotionalFeedbackEntry[],
      subscriptionCancelAt: null,
      subscriptionEndDate: null,
      subscriptionIsLifetime: false,
    });
  },

  completeOnboarding: () => {
    set({ hasCompletedOnboarding: true });
  },

  setUserId: (userId: string | null) => 
    set({ userId }),
})); 