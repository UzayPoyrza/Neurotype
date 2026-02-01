export interface MentalHealthModule {
  id: string;
  title: string;
  description: string;
  color: string;
  icon?: string;
  meditationCount: number;
  category: 'disorder' | 'wellness' | 'skill' | 'winddown';
  likedSessions?: any[]; // Optional field for liked sessions
}

// Category-based color system
export const categoryColors = {
  disorder: '#FF6B6B', // Red for disorders
  wellness: '#6BCB77', // Green for wellness
  skill: '#5B8DEE',    // Blue for skills
  winddown: '#B8A9E8'  // Light purple for wind down
};

// Function to get color based on category
export const getCategoryColor = (category: 'disorder' | 'wellness' | 'skill' | 'winddown'): string => {
  return categoryColors[category];
};

export const mentalHealthModules: MentalHealthModule[] = [
  // Disorder
  {
    id: 'anxiety',
    title: 'Anxiety',
    description: 'Calm worry loops; feel steady again.',
    color: getCategoryColor('disorder'),
    meditationCount: 18,
    category: 'disorder'
  },
  {
    id: 'panic',
    title: 'Panic Disorder',
    description: 'Ease panic waves; regain control fast.',
    color: getCategoryColor('disorder'),
    meditationCount: 16,
    category: 'disorder'
  },
  {
    id: 'depression',
    title: 'Depression',
    description: 'Lift heaviness with gentle practices.',
    color: getCategoryColor('disorder'),
    meditationCount: 22,
    category: 'disorder'
  },
  {
    id: 'adhd',
    title: 'ADHD',
    description: 'Attention Deficiency: steady focus.',
    color: getCategoryColor('disorder'),
    meditationCount: 14,
    category: 'disorder'
  },
  // Wellness
  {
    id: 'burnout',
    title: 'Burnout',
    description: 'Recover energy; reset your limits.',
    color: getCategoryColor('wellness'),
    meditationCount: 12,
    category: 'wellness'
  },
  {
    id: 'self-compassion',
    title: 'Self-Compassion',
    description: 'Be kinder to yourself; soften shame.',
    color: getCategoryColor('wellness'),
    meditationCount: 11,
    category: 'wellness'
  },
  {
    id: 'stress',
    title: 'Stress Relief',
    description: 'Release tension; settle body and mind.',
    color: getCategoryColor('wellness'),
    meditationCount: 25,
    category: 'wellness'
  },
  // Skills
  {
    id: 'focus',
    title: 'Focus',
    description: 'Train attention; stay on one thing.',
    color: getCategoryColor('skill'),
    meditationCount: 17,
    category: 'skill'
  },
  {
    id: 'addiction',
    title: 'Addiction',
    description: 'Ride cravings; choose what matters.',
    color: getCategoryColor('skill'),
    meditationCount: 15,
    category: 'skill'
  },
  {
    id: 'mindfulness',
    title: 'Mindfulness',
    description: 'Notice the present; return to now.',
    color: getCategoryColor('skill'),
    meditationCount: 28,
    category: 'skill'
  },
  // Wind down
  {
    id: 'sleep',
    title: 'Sleep',
    description: 'Insomnia relief: quiet the mind.',
    color: getCategoryColor('winddown'),
    meditationCount: 20,
    category: 'winddown'
  }
];
