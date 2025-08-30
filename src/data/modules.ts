export interface MentalHealthModule {
  id: string;
  title: string;
  description: string;
  color: string;
  icon?: string;
  meditationCount: number;
  category: 'disorder' | 'wellness' | 'skill';
}

export const mentalHealthModules: MentalHealthModule[] = [
  {
    id: 'anxiety',
    title: 'Anxiety',
    description: 'Calm your mind and reduce anxious thoughts',
    color: '#FF6B6B',
    meditationCount: 18,
    category: 'disorder'
  },
  {
    id: 'adhd',
    title: 'ADHD',
    description: 'Improve focus and attention regulation',
    color: '#4ECDC4',
    meditationCount: 14,
    category: 'disorder'
  },
  {
    id: 'depression',
    title: 'Depression',
    description: 'Lift your mood and find inner balance',
    color: '#45B7D1',
    meditationCount: 22,
    category: 'disorder'
  },
  {
    id: 'bipolar',
    title: 'Bipolar Disorder',
    description: 'Stabilize emotions and find equilibrium',
    color: '#96CEB4',
    meditationCount: 12,
    category: 'disorder'
  },
  {
    id: 'panic',
    title: 'Panic Disorder',
    description: 'Manage panic attacks and restore calm',
    color: '#FFEAA7',
    meditationCount: 16,
    category: 'disorder'
  },
  {
    id: 'ptsd',
    title: 'PTSD',
    description: 'Heal trauma and find peace',
    color: '#DDA0DD',
    meditationCount: 19,
    category: 'disorder'
  },
  {
    id: 'stress',
    title: 'Stress Relief',
    description: 'Release tension and unwind',
    color: '#98D8C8',
    meditationCount: 25,
    category: 'wellness'
  },
  {
    id: 'sleep',
    title: 'Better Sleep',
    description: 'Improve sleep quality and rest deeply',
    color: '#A8A8F0',
    meditationCount: 20,
    category: 'wellness'
  },
  {
    id: 'focus',
    title: 'Focus & Clarity',
    description: 'Sharpen concentration and mental clarity',
    color: '#FFB347',
    meditationCount: 17,
    category: 'skill'
  },
  {
    id: 'emotional-regulation',
    title: 'Emotional Regulation',
    description: 'Master your emotions and responses',
    color: '#F7B2BD',
    meditationCount: 15,
    category: 'skill'
  },
  {
    id: 'mindfulness',
    title: 'Mindfulness',
    description: 'Cultivate present-moment awareness',
    color: '#B4E7CE',
    meditationCount: 28,
    category: 'skill'
  },
  {
    id: 'self-compassion',
    title: 'Self-Compassion',
    description: 'Develop kindness towards yourself',
    color: '#FFD93D',
    meditationCount: 11,
    category: 'wellness'
  }
];