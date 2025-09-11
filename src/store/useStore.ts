import { create } from 'zustand';
import { UserProgress, FilterState, SessionDelta, Session } from '../types';
import { initialUserProgress } from '../data/mockData';

// Helper function to create subtle background colors from module colors
export const createSubtleBackground = (moduleColor: string): string => {
  // Convert hex to RGB
  const hex = moduleColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Create a very subtle tint by mixing with white (95% white, 5% module color)
  const mixedR = Math.round(255 * 0.95 + r * 0.05);
  const mixedG = Math.round(255 * 0.95 + g * 0.05);
  const mixedB = Math.round(255 * 0.95 + b * 0.05);
  
  return `rgb(${mixedR}, ${mixedG}, ${mixedB})`;
};

interface AppState {
  userProgress: UserProgress;
  filters: FilterState;
  reminderEnabled: boolean;
  darkThemeEnabled: boolean;
  profileIcon: string;
  subscriptionType: 'basic' | 'premium';
  activeSession: Session | null;
  activeModuleId: string | null;
  recentModuleIds: string[];
  globalBackgroundColor: string;
  addSessionDelta: (delta: SessionDelta) => void;
  setFilters: (filters: FilterState) => void;
  toggleReminder: () => void;
  toggleDarkTheme: () => void;
  setProfileIcon: (icon: string) => void;
  setSubscriptionType: (type: 'basic' | 'premium') => void;
  setActiveSession: (session: Session | null) => void;
  setActiveModuleId: (moduleId: string | null) => void;
  addRecentModule: (moduleId: string) => void;
  setGlobalBackgroundColor: (color: string) => void;
}

export const useStore = create<AppState>((set) => ({
  userProgress: initialUserProgress,
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
    set({ globalBackgroundColor: color })
})); 