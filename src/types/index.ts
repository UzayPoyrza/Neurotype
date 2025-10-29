export type Modality = 'sound' | 'movement' | 'mantra' | 'visualization' | 'somatic' | 'mindfulness';

export type Goal = 'anxiety' | 'focus' | 'sleep';

export interface Session {
  id: string;
  title: string;
  durationMin: number;
  modality: Modality;
  goal: Goal;
  description?: string;
  whyItWorks?: string;
  adaptiveReason?: string;
  isRecommended?: boolean;
  isTutorial?: boolean;
}

export interface SessionDelta {
  date: string;
  before: number;
  after: number;
  sessionId?: string;
  moduleId?: string;
}

export interface TechniqueEffectiveness {
  techniqueId: string;
  techniqueName: string;
  effectiveness: number | null; // null means "Haven't tried yet", 0-100 means percentage
}

export interface UserProgress {
  streak: number;
  bestStreak: number;
  sessionDeltas: SessionDelta[];
  techniqueEffectiveness: TechniqueEffectiveness[];
}

export interface FilterState {
  modality: Modality | 'all';
  goal: Goal | 'all';
} 