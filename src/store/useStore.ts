import { create } from 'zustand';
import { UserProgress, FilterState, SessionDelta } from '../types';
import { initialUserProgress } from '../data/mockData';

interface AppState {
  userProgress: UserProgress;
  filters: FilterState;
  reminderEnabled: boolean;
  addSessionDelta: (delta: SessionDelta) => void;
  setFilters: (filters: FilterState) => void;
  toggleReminder: () => void;
}

export const useStore = create<AppState>((set) => ({
  userProgress: initialUserProgress,
  filters: {
    modality: 'all',
    goal: 'all'
  },
  reminderEnabled: false,
  
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
    set((state) => ({ reminderEnabled: !state.reminderEnabled }))
})); 