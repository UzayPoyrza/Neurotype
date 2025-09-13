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
    { date: '2024-01-15', before: 7, after: 4 },
    { date: '2024-01-16', before: 6, after: 3 },
    { date: '2024-01-17', before: 8, after: 5 },
    { date: '2024-01-18', before: 5, after: 2 },
    { date: '2024-01-19', before: 7, after: 4 },
    { date: '2024-01-20', before: 6, after: 3 },
    { date: '2024-01-21', before: 8, after: 5 }
  ]
}; 