export interface MentalHealthModule {
  id: string;
  title: string;
  description: string;
  color: string;
  icon?: string;
  meditationCount: number;
  category: 'disorder' | 'wellness' | 'skill';
  likedSessions?: any[]; // Optional field for liked sessions
}

// Category-based color system
export const categoryColors = {
  disorder: '#FF6B6B', // Red for disorders
  wellness: '#4ECDC4', // Teal for wellness
  skill: '#96CEB4'     // Green for skills
};

// Function to get color based on category
export const getCategoryColor = (category: 'disorder' | 'wellness' | 'skill'): string => {
  return categoryColors[category];
};

export const mentalHealthModules: MentalHealthModule[] = [
  {
    id: 'anxiety',
    title: 'Anxiety',
    description: 'Calm your mind and reduce anxious thoughts',
    color: getCategoryColor('disorder'),
    meditationCount: 18,
    category: 'disorder'
  },
  {
    id: 'adhd',
    title: 'ADHD',
    description: 'Improve focus and attention regulation',
    color: getCategoryColor('disorder'),
    meditationCount: 14,
    category: 'disorder'
  },
  {
    id: 'depression',
    title: 'Depression',
    description: 'Lift your mood and find inner balance',
    color: getCategoryColor('disorder'),
    meditationCount: 22,
    category: 'disorder'
  },
  {
    id: 'bipolar',
    title: 'Bipolar Disorder',
    description: 'Stabilize emotions and find equilibrium',
    color: getCategoryColor('disorder'),
    meditationCount: 12,
    category: 'disorder'
  },
  {
    id: 'panic',
    title: 'Panic Disorder',
    description: 'Manage panic attacks and restore calm',
    color: getCategoryColor('disorder'),
    meditationCount: 16,
    category: 'disorder'
  },
  {
    id: 'ptsd',
    title: 'PTSD',
    description: 'Heal trauma and find peace',
    color: getCategoryColor('disorder'),
    meditationCount: 19,
    category: 'disorder'
  },
  {
    id: 'stress',
    title: 'Stress Relief',
    description: 'Release tension and unwind',
    color: getCategoryColor('wellness'),
    meditationCount: 25,
    category: 'wellness'
  },
  {
    id: 'sleep',
    title: 'Better Sleep',
    description: 'Improve sleep quality and rest deeply',
    color: getCategoryColor('wellness'),
    meditationCount: 20,
    category: 'wellness'
  },
  {
    id: 'focus',
    title: 'Focus & Clarity',
    description: 'Sharpen concentration and mental clarity',
    color: getCategoryColor('skill'),
    meditationCount: 17,
    category: 'skill'
  },
  {
    id: 'emotional-regulation',
    title: 'Emotional Regulation',
    description: 'Master your emotions and responses',
    color: getCategoryColor('skill'),
    meditationCount: 15,
    category: 'skill'
  },
  {
    id: 'mindfulness',
    title: 'Mindfulness',
    description: 'Cultivate present-moment awareness',
    color: getCategoryColor('skill'),
    meditationCount: 28,
    category: 'skill'
  },
  {
    id: 'self-compassion',
    title: 'Self-Compassion',
    description: 'Develop kindness towards yourself',
    color: getCategoryColor('wellness'),
    meditationCount: 11,
    category: 'wellness'
  }
];