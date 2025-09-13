import { Session, UserProgress } from '../types';

export const mockSessions: Session[] = [
  {
    id: '1',
    title: 'Ocean Waves Meditation',
    durationMin: 5,
    modality: 'sound',
    goal: 'anxiety'
  },
  {
    id: '2',
    title: 'Gentle Stretching Flow',
    durationMin: 8,
    modality: 'movement',
    goal: 'focus'
  },
  {
    id: '3',
    title: 'Om Mantra Practice',
    durationMin: 10,
    modality: 'mantra',
    goal: 'sleep'
  },
  {
    id: '4',
    title: 'Mountain Visualization',
    durationMin: 6,
    modality: 'visualization',
    goal: 'anxiety'
  },
  {
    id: '5',
    title: 'Body Scan Journey',
    durationMin: 12,
    modality: 'somatic',
    goal: 'focus'
  },
  {
    id: '6',
    title: 'Breath Awareness',
    durationMin: 7,
    modality: 'mindfulness',
    goal: 'sleep'
  },
  {
    id: '7',
    title: 'Forest Ambience',
    durationMin: 4,
    modality: 'sound',
    goal: 'focus'
  },
  {
    id: '8',
    title: 'Qi Gong Flow',
    durationMin: 15,
    modality: 'movement',
    goal: 'anxiety'
  },
  {
    id: '9',
    title: 'Loving Kindness Mantra',
    durationMin: 9,
    modality: 'mantra',
    goal: 'focus'
  },
  {
    id: '10',
    title: 'Sunset Visualization',
    durationMin: 5,
    modality: 'visualization',
    goal: 'sleep'
  },
  {
    id: '11',
    title: 'Progressive Relaxation',
    durationMin: 11,
    modality: 'somatic',
    goal: 'anxiety'
  },
  {
    id: '12',
    title: 'Present Moment Practice',
    durationMin: 6,
    modality: 'mindfulness',
    goal: 'focus'
  }
];

export const initialUserProgress: UserProgress = {
  streak: 5,
  bestStreak: 20,
  sessionDeltas: [
    { date: '2024-01-15', before: 7, after: 4, sessionId: '1', moduleId: 'anxiety' },
    { date: '2024-01-16', before: 6, after: 3, sessionId: '2', moduleId: 'focus' },
    { date: '2024-01-17', before: 8, after: 5, sessionId: '3', moduleId: 'sleep' },
    { date: '2024-01-18', before: 5, after: 2, sessionId: '4', moduleId: 'anxiety' },
    { date: '2024-01-19', before: 7, after: 4, sessionId: '5', moduleId: 'focus' },
    { date: '2024-01-20', before: 6, after: 3, sessionId: '6', moduleId: 'sleep' },
    { date: '2024-01-21', before: 8, after: 5, sessionId: '7', moduleId: 'focus' },
    // Add some recent dates for testing
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], before: 6, after: 3, sessionId: '8', moduleId: 'anxiety' },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], before: 5, after: 2, sessionId: '9', moduleId: 'focus' },
    { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], before: 7, after: 4, sessionId: '10', moduleId: 'sleep' },
    // Add August 2025 data for testing
    { date: '2025-08-03', before: 7, after: 4, sessionId: '11', moduleId: 'stress' },
    { date: '2025-08-05', before: 6, after: 3, sessionId: '12', moduleId: 'mindfulness' },
    { date: '2025-08-08', before: 8, after: 5, sessionId: '13', moduleId: 'anxiety' },
    { date: '2025-08-12', before: 5, after: 2, sessionId: '14', moduleId: 'focus' },
    { date: '2025-08-15', before: 7, after: 4, sessionId: '15', moduleId: 'sleep' },
    { date: '2025-08-18', before: 6, after: 3, sessionId: '16', moduleId: 'depression' },
    { date: '2025-08-20', before: 8, after: 5, sessionId: '17', moduleId: 'stress' },
    { date: '2025-08-22', before: 5, after: 2, sessionId: '18', moduleId: 'mindfulness' },
    { date: '2025-08-25', before: 6, after: 3, sessionId: '19', moduleId: 'anxiety' },
    { date: '2025-08-28', before: 7, after: 4, sessionId: '20', moduleId: 'focus' },
    { date: '2025-08-30', before: 5, after: 2, sessionId: '21', moduleId: 'sleep' },
  ],
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
  ]
}; 