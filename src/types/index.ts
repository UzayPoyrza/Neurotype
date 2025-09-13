export type Modality = 'sound' | 'movement' | 'mantra' | 'visualization' | 'somatic' | 'mindfulness';

export type Goal = 'anxiety' | 'focus' | 'sleep';

export interface Session {
  id: string;
  title: string;
  durationMin: number;
  modality: Modality;
  goal: Goal;
}

export interface SessionDelta {
  date: string;
  before: number;
  after: number;
  sessionId?: string;
  moduleId?: string;
}

export interface UserProgress {
  streak: number;
  bestStreak: number;
  sessionDeltas: SessionDelta[];
}

export interface FilterState {
  modality: Modality | 'all';
  goal: Goal | 'all';
} 