import { create } from 'zustand';
import { UserProgress, FilterState, SessionDelta, Session, EmotionalFeedbackEntry } from '../types';
import { initialUserProgress } from '../data/mockData';
import { mentalHealthModules } from '../data/modules';

// Helper function to create subtle background colors from module colors
export const createSubtleBackground = (moduleColor: string): string => {
  // Convert hex to RGB
  const hex = moduleColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Create a more noticeable tint by mixing with white (90% white, 10% module color)
  // This makes blues and purples more visible while keeping it subtle
  const mixedR = Math.round(255 * 0.90 + r * 0.10);
  const mixedG = Math.round(255 * 0.90 + g * 0.10);
  const mixedB = Math.round(255 * 0.90 + b * 0.10);
  
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

// Pre-calculate all module background colors for instant switching
export const prerenderedModuleBackgrounds: Record<string, string> = {};
mentalHealthModules.forEach(module => {
  prerenderedModuleBackgrounds[module.id] = createSubtleBackground(module.color);
});

const buildInitialStoreData = () => {
  const emotionalFeedbackHistorySeed: EmotionalFeedbackEntry[] = [
    {
      id: 'feedback-1',
      sessionId: '1',
      label: 'Bad',
      timestampSeconds: 75,
      date: '2025-08-28T20:05:00Z',
    },
    {
      id: 'feedback-2',
      sessionId: '8',
      label: 'Okay',
      timestampSeconds: 180,
      date: '2025-08-28T20:10:00Z',
    },
    {
      id: 'feedback-3',
      sessionId: '11',
      label: 'Good',
      timestampSeconds: 320,
      date: '2025-08-29T14:22:00Z',
    },
    {
      id: 'feedback-4',
      sessionId: '12',
      label: 'Great',
      timestampSeconds: 420,
      date: '2025-08-29T21:05:00Z',
    },
    {
      id: 'feedback-5',
      sessionId: '5',
      label: 'Meh',
      timestampSeconds: 95,
      date: '2025-08-30T08:45:00Z',
    },
    {
      id: 'feedback-6',
      sessionId: '16',
      label: 'Good',
      timestampSeconds: 210,
      date: '2025-08-30T09:15:00Z',
    },
  ];

  return {
    userProgress: {
      ...initialUserProgress,
      sessionDeltas: initialUserProgress.sessionDeltas.map(delta => ({ ...delta })),
      techniqueEffectiveness: initialUserProgress.techniqueEffectiveness.map(item => ({ ...item })),
    },
    userFirstName: 'Ava',
    filters: {
      modality: 'all',
      goal: 'all',
    } as FilterState,
    reminderEnabled: false,
    darkThemeEnabled: false,
    profileIcon: '👤',
    subscriptionType: 'premium' as const,
    activeSession: null,
    activeModuleId: null,
    recentModuleIds: [] as string[],
    globalBackgroundColor: '#f2f2f7',
    currentScreen: 'today' as const,
    todayModuleId: 'anxiety',
    likedSessionIds: [] as string[],
    isTransitioning: false,
    emotionalFeedbackHistory: emotionalFeedbackHistorySeed.map(entry => ({ ...entry })),
    // Placeholder data: some completed sessions for different modules (using today's date)
    completedTodaySessions: (() => {
      const today = new Date().toISOString().split('T')[0];
      return {
        // Anxiety module - recommended session completed
        [`anxiety-${today}`]: ['1'],
        // Focus module - recommended and one alternative completed
        [`focus-${today}`]: ['2', '5'],
        // Sleep module - one alternative completed (not recommended)
        [`sleep-${today}`]: ['10'],
        // Stress module - recommended completed
        [`stress-${today}`]: ['11'],
        // Mindfulness module - two sessions completed (recommended + one alternative)
        [`mindfulness-${today}`]: ['12', '13'],
      } as Record<string, string[]>;
    })(),
    isLoggedIn: false,
    hasCompletedOnboarding: false,
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
  activeSession: Session | null;
  activeModuleId: string | null;
  recentModuleIds: string[];
  globalBackgroundColor: string;
  currentScreen: 'today' | 'explore' | 'progress' | 'profile' | 'settings' | 'module-detail';
  todayModuleId: string | null;
  likedSessionIds: string[];
  isTransitioning: boolean;
  emotionalFeedbackHistory: EmotionalFeedbackEntry[];
  completedTodaySessions: Record<string, string[]>; // Key: "moduleId-date", Value: array of session IDs
  isLoggedIn: boolean;
  hasCompletedOnboarding: boolean;
  addSessionDelta: (delta: SessionDelta) => void;
  setFilters: (filters: FilterState) => void;
  toggleReminder: () => void;
  toggleDarkTheme: () => void;
  setUserFirstName: (name: string) => void;
  setProfileIcon: (icon: string) => void;
  setSubscriptionType: (type: 'basic' | 'premium') => void;
  setActiveSession: (session: Session | null) => void;
  setActiveModuleId: (moduleId: string | null) => void;
  addRecentModule: (moduleId: string) => void;
  setGlobalBackgroundColor: (color: string) => void;
  setCurrentScreen: (screen: 'today' | 'explore' | 'progress' | 'profile' | 'settings' | 'module-detail') => void;
  setTodayModuleId: (moduleId: string | null) => void;
  toggleLikedSession: (sessionId: string) => void;
  isSessionLiked: (sessionId: string) => boolean;
  setIsTransitioning: (isTransitioning: boolean) => void;
  addEmotionalFeedbackEntry: (entry: EmotionalFeedbackEntry) => void;
  removeEmotionalFeedbackEntry: (entryId: string) => void;
  markSessionCompletedToday: (moduleId: string, sessionId: string, date?: string) => void;
  isSessionCompletedToday: (moduleId: string, sessionId: string, date?: string) => boolean;
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

  setUserFirstName: (name: string) =>
    set({ userFirstName: name }),
    
  setProfileIcon: (icon: string) => 
    set({ profileIcon: icon }),
    
  setSubscriptionType: (type: 'basic' | 'premium') => 
    set({ subscriptionType: type }),
    
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
    
  setGlobalBackgroundColor: (color: string) => 
    set({ globalBackgroundColor: color }),
    
  setCurrentScreen: (screen: 'today' | 'explore' | 'progress' | 'profile' | 'settings' | 'module-detail') => 
    set({ currentScreen: screen }),
    
  setTodayModuleId: (moduleId: string | null) => 
    set({ todayModuleId: moduleId }),
    
  toggleLikedSession: (sessionId: string) => 
    set((state) => ({
      likedSessionIds: state.likedSessionIds.includes(sessionId)
        ? state.likedSessionIds.filter(id => id !== sessionId)
        : [...state.likedSessionIds, sessionId]
    })),
    
  isSessionLiked: (sessionId: string): boolean => {
    const state = get();
    return state.likedSessionIds.includes(sessionId);
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

  markSessionCompletedToday: (moduleId: string, sessionId: string, date?: string) => {
    const today = date || new Date().toISOString().split('T')[0];
    const key = `${moduleId}-${today}`;
    set((state) => {
      const completed = state.completedTodaySessions[key] || [];
      if (!completed.includes(sessionId)) {
        return {
          completedTodaySessions: {
            ...state.completedTodaySessions,
            [key]: [...completed, sessionId]
          }
        };
      }
      return state;
    });
  },

  isSessionCompletedToday: (moduleId: string, sessionId: string, date?: string): boolean => {
    const today = date || new Date().toISOString().split('T')[0];
    const key = `${moduleId}-${today}`;
    const state = get();
    const completed = state.completedTodaySessions[key] || [];
    // Check both with and without -today suffix
    return completed.includes(sessionId) || completed.includes(sessionId.replace('-today', ''));
  },

  resetAppData: () => {
    const defaults = buildInitialStoreData();
    set((state) => ({
      ...defaults,
      currentScreen: state.currentScreen,
      hasCompletedOnboarding: state.hasCompletedOnboarding, // Preserve onboarding state
    }));
  },

  logout: () => {
    set({ isLoggedIn: false });
  },

  completeOnboarding: () => {
    set({ hasCompletedOnboarding: true });
  },
})); 