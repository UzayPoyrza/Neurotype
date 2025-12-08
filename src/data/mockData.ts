import { Session, UserProgress } from '../types';

export const mockSessions: Session[] = [
  {
    id: '1',
    title: 'Ocean Waves Meditation',
    durationMin: 5,
    modality: 'sound',
    goal: 'anxiety',
    description: 'Immerse yourself in the calming sounds of ocean waves. This guided meditation uses nature sounds to help you find peace and reduce anxiety through auditory relaxation.',
    whyItWorks: 'Ocean sounds have a natural rhythm that mirrors our breathing patterns, helping to regulate the nervous system and activate the relaxation response. The repetitive nature of waves creates a meditative state that reduces cortisol levels.',
    adaptiveReason: 'Recommended based on your recent anxiety patterns',
    isRecommended: true
  },
  {
    id: '2',
    title: 'Gentle Stretching Flow',
    durationMin: 8,
    modality: 'movement',
    goal: 'focus',
    description: 'A gentle movement practice combining mindful stretching with breath awareness. Perfect for releasing tension and preparing your mind for focused work.',
    whyItWorks: 'Gentle movement increases blood flow to the brain and releases endorphins. The combination of physical movement and mindful breathing activates both the body and mind, creating an optimal state for concentration.',
    adaptiveReason: 'Best for your current energy level',
    isRecommended: false
  },
  {
    id: '3',
    title: 'Om Mantra Practice',
    durationMin: 10,
    modality: 'mantra',
    goal: 'sleep',
    description: 'A traditional mantra meditation using the sacred sound "Om" to calm the mind and prepare for restful sleep.',
    whyItWorks: 'The vibration of "Om" has been shown to activate the parasympathetic nervous system, promoting relaxation and sleep. Mantra repetition creates a single-pointed focus that quiets mental chatter.',
    adaptiveReason: 'Perfect for your bedtime routine',
    isRecommended: false
  },
  {
    id: '4',
    title: 'Mountain Visualization',
    durationMin: 6,
    modality: 'visualization',
    goal: 'anxiety',
    description: 'Visualize yourself as a strong, stable mountain. This guided imagery helps you feel grounded and resilient in the face of life\'s challenges.',
    whyItWorks: 'Visualization activates the same neural pathways as actual experience, helping you embody qualities of strength and stability. This practice builds confidence and reduces anxious thoughts.',
    adaptiveReason: 'Matches your current emotional state',
    isRecommended: false
  },
  {
    id: '5',
    title: 'Body Scan Journey',
    durationMin: 12,
    modality: 'somatic',
    goal: 'focus',
    description: 'A systematic journey through your body, bringing awareness to each part. This practice helps you develop deep body awareness and mental clarity.',
    whyItWorks: 'Body scanning activates the insula cortex, which is responsible for interoceptive awareness. This practice improves attention regulation and reduces mind-wandering by grounding you in physical sensations.',
    adaptiveReason: 'Ideal for improving concentration',
    isRecommended: false
  },
  {
    id: '6',
    title: 'Breath Awareness',
    durationMin: 7,
    modality: 'mindfulness',
    goal: 'sleep',
    description: 'A simple yet powerful practice of observing your natural breath. Perfect for winding down and preparing for sleep.',
    whyItWorks: 'Conscious breathing activates the vagus nerve, which controls the parasympathetic nervous system. This directly signals your body to relax and prepare for sleep.',
    adaptiveReason: 'Gentle approach for better sleep',
    isRecommended: false
  },
  {
    id: '7',
    title: 'Forest Ambience',
    durationMin: 4,
    modality: 'sound',
    goal: 'focus',
    description: 'Short nature sounds from a peaceful forest to help you quickly center and focus. Perfect for a quick mental reset.',
    whyItWorks: 'Nature sounds have been proven to improve cognitive performance and attention. The gentle background noise helps mask distracting sounds while providing a calming auditory environment.',
    adaptiveReason: 'Quick focus boost',
    isRecommended: false
  },
  {
    id: '8',
    title: 'Qi Gong Flow',
    durationMin: 15,
    modality: 'movement',
    goal: 'anxiety',
    description: 'Traditional Chinese energy practice combining gentle movements with breath work to balance your energy and reduce anxiety.',
    whyItWorks: 'Qi Gong movements are designed to balance the body\'s energy systems and activate the relaxation response. The slow, intentional movements help release stored tension and calm the nervous system.',
    adaptiveReason: 'Comprehensive anxiety relief',
    isRecommended: false
  },
  {
    id: '9',
    title: 'Loving Kindness Mantra',
    durationMin: 9,
    modality: 'mantra',
    goal: 'focus',
    description: 'Cultivate compassion and focus through loving-kindness phrases. This practice enhances emotional regulation and mental clarity.',
    whyItWorks: 'Loving-kindness meditation activates brain regions associated with positive emotions and social connection. This practice reduces negative thoughts and improves emotional stability, leading to better focus.',
    adaptiveReason: 'Enhances emotional balance',
    isRecommended: false
  },
  {
    id: '10',
    title: 'Sunset Visualization',
    durationMin: 5,
    modality: 'visualization',
    goal: 'sleep',
    description: 'Imagine watching a beautiful sunset, feeling the warmth and peace as day transitions to night. A perfect pre-sleep visualization.',
    whyItWorks: 'Visualizing peaceful scenes activates the brain\'s default mode network in a calming way. The imagery of natural transitions helps signal to your body that it\'s time to wind down and prepare for sleep.',
    adaptiveReason: 'Natural sleep preparation',
    isRecommended: false
  },
  {
    id: '11',
    title: 'Progressive Relaxation',
    durationMin: 11,
    modality: 'somatic',
    goal: 'anxiety',
    description: 'Systematically tense and release each muscle group to achieve deep physical and mental relaxation.',
    whyItWorks: 'Progressive muscle relaxation directly reduces muscle tension, which is often held during anxiety. This practice teaches your body the difference between tension and relaxation, helping you recognize and release stress.',
    adaptiveReason: 'Deep tension release',
    isRecommended: false
  },
  {
    id: '12',
    title: 'Present Moment Practice',
    durationMin: 6,
    modality: 'mindfulness',
    goal: 'focus',
    description: 'A mindfulness practice that brings your attention to the present moment, training your mind to stay focused and aware.',
    whyItWorks: 'Mindfulness meditation strengthens the anterior cingulate cortex, which is responsible for attention control. Regular practice improves your ability to focus and reduces distractibility.',
    adaptiveReason: 'Builds attention skills',
    isRecommended: false
  },
  {
    id: '13',
    title: 'Calm Focus Reset',
    durationMin: 9,
    modality: 'mindfulness',
    goal: 'focus',
    description: 'A quick reset to regain clarity through mindful breathing and intention setting.',
    whyItWorks: 'Combining breath awareness with intention helps quiet mental chatter and restores attention.',
    adaptiveReason: 'Great when your mind feels scattered',
    isRecommended: false
  },
  {
    id: '14',
    title: 'Steady Beam Practice',
    durationMin: 7,
    modality: 'visualization',
    goal: 'focus',
    description: 'Visualize a steady beam of light guiding your attention toward a single goal.',
    whyItWorks: 'Guided visualization recruits focus-related neural pathways and reduces distractions.',
    adaptiveReason: 'Perfect before deep work sessions',
    isRecommended: false
  },
  {
    id: '15',
    title: 'Sleepy Sunset Drift',
    durationMin: 12,
    modality: 'sound',
    goal: 'sleep',
    description: 'Drift off with gentle narration and soft ambient tones inspired by sunset hues.',
    whyItWorks: 'Soothing audio cues signal the nervous system to shift into rest-and-digest mode.',
    adaptiveReason: 'Ideal for winding down after a long day',
    isRecommended: false
  },
  {
    id: '16',
    title: 'Morning Grounding Flow',
    durationMin: 10,
    modality: 'movement',
    goal: 'anxiety',
    description: 'A gentle standing flow to shake out stress and welcome grounded energy.',
    whyItWorks: 'Slow, rhythmic movement paired with breath calms the sympathetic nervous system.',
    adaptiveReason: 'Start your day with calm steadiness',
    isRecommended: false
  },
  {
    id: '17',
    title: 'Tension Release Walk',
    durationMin: 8,
    modality: 'movement',
    goal: 'anxiety',
    description: 'Guided walking meditation to release tension with each mindful step.',
    whyItWorks: 'Walking meditations integrate body and mind, reducing anxious cycles through motion.',
    adaptiveReason: 'Use when restlessness peaks',
    isRecommended: false
  },
  {
    id: '18',
    title: 'Mindful Microbreak',
    durationMin: 6,
    modality: 'mindfulness',
    goal: 'focus',
    description: 'A short check-in that brings awareness back to the present moment between tasks.',
    whyItWorks: 'Brief mindfulness resets improve executive functioning and task switching.',
    adaptiveReason: 'Designed for mid-day mental resets',
    isRecommended: false
  },
  {
    id: '19',
    title: 'Balanced Breath Flow',
    durationMin: 11,
    modality: 'somatic',
    goal: 'anxiety',
    description: 'Alternate nostril breathing paired with body scanning to balance your energy.',
    whyItWorks: 'Balancing the breath modulates the autonomic nervous system and reduces anxiety.',
    adaptiveReason: 'Supports emotional equilibrium',
    isRecommended: false
  },
  {
    id: '20',
    title: 'Focus Pulse',
    durationMin: 5,
    modality: 'sound',
    goal: 'focus',
    description: 'Subtle binaural tones and cues that nudge your mind toward alert calmness.',
    whyItWorks: 'Sound entrainment promotes steady brainwave states associated with concentration.',
    adaptiveReason: 'Great before creative sprints',
    isRecommended: false
  },
  {
    id: '21',
    title: 'Moonlit Wind Down',
    durationMin: 14,
    modality: 'visualization',
    goal: 'sleep',
    description: 'Float through a moonlit landscape designed to ease you into deep rest.',
    whyItWorks: 'Soft guided imagery releases muscle tension and prepares the mind for sleep.',
    adaptiveReason: 'For nights when your mind stays busy',
    isRecommended: false
  }
];

export const initialUserProgress: UserProgress = {
  streak: 5,
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