import { create } from 'zustand';
import { UserProgress, FilterState, SessionDelta, Session } from '../types';
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

// Pre-calculate all module background colors for instant switching
export const prerenderedModuleBackgrounds: Record<string, string> = {};
mentalHealthModules.forEach(module => {
  prerenderedModuleBackgrounds[module.id] = createSubtleBackground(module.color);
});

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
}

export const useStore = create<AppState>((set, get) => ({
  userProgress: initialUserProgress,
  userFirstName: 'Ava',
  filters: {
    modality: 'all',
    goal: 'all'
  },
  reminderEnabled: false,
  darkThemeEnabled: false,
  profileIcon: '👤',
  subscriptionType: 'premium',
  activeSession: null,
  activeModuleId: null,
  recentModuleIds: [],
  globalBackgroundColor: '#f2f2f7', // Default iOS background
  currentScreen: 'today',
  todayModuleId: 'anxiety', // Default module
  likedSessionIds: [],
  isTransitioning: false,
  
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
    set({ isTransitioning })
})); 