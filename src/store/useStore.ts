import { create } from 'zustand';
import { UserProgress, FilterState, SessionDelta, Session } from '../types';
import { initialUserProgress } from '../data/mockData';

interface AppState {
  userProgress: UserProgress;
  filters: FilterState;
  reminderEnabled: boolean;
  darkThemeEnabled: boolean;
  profileIcon: string;
  activeSession: Session | null;
  activeModuleId: string | null;
  recentModuleIds: string[];
  addSessionDelta: (delta: SessionDelta) => void;
  setFilters: (filters: FilterState) => void;
  toggleReminder: () => void;
  toggleDarkTheme: () => void;
  setProfileIcon: (icon: string) => void;
  setActiveSession: (session: Session | null) => void;
  setActiveModuleId: (moduleId: string | null) => void;
  addRecentModule: (moduleId: string) => void;
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
  activeSession: null,
  activeModuleId: null,
  recentModuleIds: [],
  
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
    }))
})); 