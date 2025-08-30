import { create } from 'zustand';
import { UserProgress, FilterState, SessionDelta, Session } from '../types';
import { initialUserProgress } from '../data/mockData';

interface AppState {
  userProgress: UserProgress;
  filters: FilterState;
  reminderEnabled: boolean;
  darkThemeEnabled: boolean;
  activeSession: Session | null;
  addSessionDelta: (delta: SessionDelta) => void;
  setFilters: (filters: FilterState) => void;
  toggleReminder: () => void;
  toggleDarkTheme: () => void;
  setActiveSession: (session: Session | null) => void;
}

export const useStore = create<AppState>((set) => ({
  userProgress: initialUserProgress,
  filters: {
    modality: 'all',
    goal: 'all'
  },
  reminderEnabled: false,
  darkThemeEnabled: false,
  activeSession: null,
  
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
    
  setActiveSession: (session: Session | null) => 
    set({ activeSession: session })
})); 