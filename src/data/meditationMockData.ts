import { Session } from '../types';

// Mock meditation audio data with realistic timing and content
export const meditationAudioData = {
  // Ocean Waves Meditation - 5 minutes
  '1': {
    duration: 300, // 5 minutes in seconds
    segments: [
      { start: 0, end: 30, type: 'intro', text: 'Welcome to Ocean Waves Meditation. Find a comfortable position and close your eyes.' },
      { start: 30, end: 60, text: 'Take three deep breaths. Inhale slowly... and exhale completely.' },
      { start: 60, end: 120, text: 'Now imagine you\'re standing on a peaceful beach. The waves gently lap against the shore.' },
      { start: 120, end: 180, text: 'With each wave, feel your tension washing away. Let the rhythm of the ocean calm your mind.' },
      { start: 180, end: 240, text: 'Breathe with the waves. Inhale as they come in, exhale as they go out.' },
      { start: 240, end: 270, text: 'Slowly bring your awareness back to your body. Wiggle your fingers and toes.' },
      { start: 270, end: 300, text: 'When you\'re ready, gently open your eyes. Take a moment to notice how you feel.' }
    ],
    backgroundAudio: 'ocean_waves.mp3',
    // Use a distinct tutorial audio for the tutorial flow
    tutorialBackgroundAudio: 'ocean_waves_tutorial.mp3',
    volume: 0.7
  },

  // Gentle Stretching Flow - 8 minutes
  '2': {
    duration: 480, // 8 minutes
    segments: [
      { start: 0, end: 30, type: 'intro', text: 'Welcome to Gentle Stretching Flow. Stand with feet hip-width apart.' },
      { start: 30, end: 60, text: 'Reach your arms overhead and stretch toward the sky. Feel your spine lengthen.' },
      { start: 60, end: 90, text: 'Slowly bend to the right, feeling the stretch along your left side. Hold for three breaths.' },
      { start: 90, end: 120, text: 'Return to center, then bend to the left. Feel the stretch along your right side.' },
      { start: 120, end: 180, text: 'Now gently twist your torso to the right, placing your left hand on your right knee.' },
      { start: 180, end: 240, text: 'Slowly twist to the left, feeling the gentle rotation in your spine.' },
      { start: 240, end: 300, text: 'Come to a forward fold, letting your arms hang heavy. Feel the stretch in your hamstrings.' },
      { start: 300, end: 360, text: 'Slowly roll up to standing, one vertebra at a time.' },
      { start: 360, end: 420, text: 'Finish with your hands at your heart center. Take three deep breaths.' },
      { start: 420, end: 480, text: 'Notice how your body feels more open and relaxed. Thank yourself for this practice.' }
    ],
    backgroundAudio: 'gentle_music.mp3',
    tutorialBackgroundAudio: 'gentle_music_tutorial.mp3',
    volume: 0.5
  },

  // Om Mantra Practice - 10 minutes
  '3': {
    duration: 600, // 10 minutes
    segments: [
      { start: 0, end: 30, type: 'intro', text: 'Welcome to Om Mantra Practice. Sit comfortably with your spine straight.' },
      { start: 30, end: 60, text: 'Place your hands in your lap, palms up. Close your eyes and take three deep breaths.' },
      { start: 60, end: 90, text: 'Now we\'ll begin with the sacred sound Om. Feel the vibration in your chest.' },
      { start: 90, end: 150, text: 'Om... (chanting) Let the sound resonate through your entire being.' },
      { start: 150, end: 210, text: 'Om... Feel the vibration connecting you to the universe.' },
      { start: 210, end: 270, text: 'Om... With each repetition, feel yourself going deeper into stillness.' },
      { start: 270, end: 330, text: 'Om... Let go of all thoughts and simply be with the sound.' },
      { start: 330, end: 390, text: 'Om... Feel the peace and tranquility within you.' },
      { start: 390, end: 450, text: 'Om... Allow the mantra to carry you into deep relaxation.' },
      { start: 450, end: 510, text: 'Now sit in silence, feeling the after-effects of the mantra.' },
      { start: 510, end: 570, text: 'Slowly bring your awareness back to your surroundings.' },
      { start: 570, end: 600, text: 'When you\'re ready, gently open your eyes. Take a moment to feel the peace within.' }
    ],
    backgroundAudio: 'om_chanting.mp3',
    tutorialBackgroundAudio: 'om_chanting_tutorial.mp3',
    volume: 0.6
  },

  // Mountain Visualization - 6 minutes
  '4': {
    duration: 360, // 6 minutes
    segments: [
      { start: 0, end: 30, type: 'intro', text: 'Welcome to Mountain Visualization. Find a comfortable seated position.' },
      { start: 30, end: 60, text: 'Close your eyes and take three deep breaths. Feel your body settling into stillness.' },
      { start: 60, end: 90, text: 'Now imagine you\'re standing at the base of a magnificent mountain.' },
      { start: 90, end: 120, text: 'Look up at the mountain\'s peak, reaching high into the sky. Feel its strength and stability.' },
      { start: 120, end: 180, text: 'Now imagine you ARE the mountain. Feel your spine as the mountain\'s core, strong and unshakeable.' },
      { start: 180, end: 240, text: 'Like the mountain, you remain steady through all weather. Storms may come, but you stand firm.' },
      { start: 240, end: 300, text: 'Feel the mountain\'s deep roots anchoring you to the earth. You are grounded and secure.' },
      { start: 300, end: 330, text: 'Slowly bring your awareness back to your body. Feel the mountain\'s strength within you.' },
      { start: 330, end: 360, text: 'When you\'re ready, gently open your eyes. Carry this mountain\'s stability with you.' }
    ],
    backgroundAudio: 'mountain_wind.mp3',
    tutorialBackgroundAudio: 'mountain_wind_tutorial.mp3',
    volume: 0.4
  },

  // Body Scan Journey - 12 minutes
  '5': {
    duration: 720, // 12 minutes
    segments: [
      { start: 0, end: 30, type: 'intro', text: 'Welcome to Body Scan Journey. Lie down comfortably and close your eyes.' },
      { start: 30, end: 60, text: 'Take three deep breaths, feeling your body relax with each exhale.' },
      { start: 60, end: 90, text: 'Now bring your attention to your toes. Notice any sensations there.' },
      { start: 90, end: 120, text: 'Slowly move your awareness up through your feet, feeling each part.' },
      { start: 120, end: 150, text: 'Continue up your calves and shins, releasing any tension you find.' },
      { start: 150, end: 180, text: 'Move to your knees and thighs, feeling the weight of your legs.' },
      { start: 180, end: 210, text: 'Now focus on your hips and pelvis, the foundation of your body.' },
      { start: 210, end: 240, text: 'Move up to your lower back, feeling the support of your spine.' },
      { start: 240, end: 270, text: 'Continue to your upper back and shoulders, releasing any tightness.' },
      { start: 270, end: 300, text: 'Now focus on your chest and heart area, feeling your breath there.' },
      { start: 300, end: 330, text: 'Move to your arms, from shoulders to fingertips, feeling their weight.' },
      { start: 330, end: 360, text: 'Now focus on your neck and throat, releasing any tension.' },
      { start: 360, end: 390, text: 'Move to your face, feeling your jaw, cheeks, and forehead relax.' },
      { start: 390, end: 420, text: 'Finally, focus on the top of your head, feeling your entire body at peace.' },
      { start: 420, end: 480, text: 'Now feel your body as a whole, relaxed and at ease.' },
      { start: 480, end: 540, text: 'Take a few moments to rest in this state of deep relaxation.' },
      { start: 540, end: 600, text: 'Slowly begin to wiggle your fingers and toes, bringing movement back.' },
      { start: 600, end: 660, text: 'Gently stretch your arms and legs, feeling your body awaken.' },
      { start: 660, end: 720, text: 'When you\'re ready, slowly open your eyes. Notice how refreshed you feel.' }
    ],
    backgroundAudio: 'soft_bells.mp3',
    tutorialBackgroundAudio: 'soft_bells_tutorial.mp3',
    volume: 0.3
  },

  // Breath Awareness - 7 minutes
  '6': {
    duration: 420, // 7 minutes
    segments: [
      { start: 0, end: 30, type: 'intro', text: 'Welcome to Breath Awareness. Sit comfortably with your spine straight.' },
      { start: 30, end: 60, text: 'Close your eyes and place your hands gently in your lap.' },
      { start: 60, end: 90, text: 'Begin by taking three deep breaths, feeling your chest and belly rise and fall.' },
      { start: 90, end: 120, text: 'Now let your breathing return to its natural rhythm. Don\'t try to change it.' },
      { start: 120, end: 180, text: 'Simply observe your breath as it flows in and out. Notice the sensation at your nostrils.' },
      { start: 180, end: 240, text: 'Feel the gentle rise and fall of your chest with each breath.' },
      { start: 240, end: 300, text: 'Notice how your belly expands slightly with each inhale and contracts with each exhale.' },
      { start: 300, end: 360, text: 'If your mind wanders, gently bring your attention back to your breath.' },
      { start: 360, end: 390, text: 'Take a few more conscious breaths, feeling the peace that comes with mindful breathing.' },
      { start: 390, end: 420, text: 'When you\'re ready, gently open your eyes. Carry this awareness with you.' }
    ],
    backgroundAudio: 'soft_rain.mp3',
    tutorialBackgroundAudio: 'soft_rain_tutorial.mp3',
    volume: 0.4
  }
};

// Mock emotional feedback data
export const emotionalFeedbackData = {
  // Track emotional state changes during meditation
  trackEmotionalState: (sessionId: string, timestamp: number, rating: number) => {
    console.log(`Emotional feedback for session ${sessionId}: ${rating}/10 at ${timestamp}s`);
    // In a real app, this would be sent to analytics or stored locally
  },

  // Get average emotional improvement for a session type
  getAverageImprovement: (goal: string) => {
    const improvements = {
      anxiety: 2.3, // Average improvement of 2.3 points
      focus: 1.8,
      sleep: 2.1
    };
    return improvements[goal as keyof typeof improvements] || 1.5;
  }
};

// Mock session progress tracking
export const sessionProgressData = {
  // Track session completion
  markSessionComplete: (sessionId: string, duration: number, emotionalRating: number) => {
    console.log(`Session ${sessionId} completed: ${duration}s, emotional rating: ${emotionalRating}/10`);
    // In a real app, this would update user progress and analytics
  },

  // Get session statistics
  getSessionStats: (sessionId: string) => {
    return {
      totalCompletions: Math.floor(Math.random() * 50) + 10,
      averageRating: (Math.random() * 2 + 6).toFixed(1), // 6.0-8.0
      lastCompleted: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  }
};

// Mock audio player functionality
export const mockAudioPlayer = {
  // Simulate audio loading
  loadAudio: (audioFile: string) => {
    console.log(`Loading audio: ${audioFile}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Audio loaded: ${audioFile}`);
        resolve(true);
      }, 1000);
    });
  },

  // Simulate audio playback
  play: () => {
    console.log('Audio playback started');
    return true;
  },

  pause: () => {
    console.log('Audio playback paused');
    return true;
  },

  stop: () => {
    console.log('Audio playback stopped');
    return true;
  },

  // Simulate seeking to specific time
  seekTo: (timeInSeconds: number) => {
    console.log(`Seeking to ${timeInSeconds}s`);
    return true;
  },

  // Get current playback time
  getCurrentTime: () => {
    return Math.floor(Math.random() * 300); // Mock current time
  },

  // Get total duration
  getDuration: () => {
    return 300; // Mock duration
  }
};

// Mock meditation session with realistic data
export const createMockMeditationSession = (sessionId: string): Session & {
  audioData: typeof meditationAudioData[string];
  emotionalFeedback: typeof emotionalFeedbackData;
  progress: typeof sessionProgressData;
  audioPlayer: typeof mockAudioPlayer;
} => {
  const baseSession = {
    id: sessionId,
    title: 'Ocean Waves Meditation',
    durationMin: 5,
    modality: 'sound',
    goal: 'anxiety',
    description: 'Immerse yourself in the calming sounds of ocean waves.',
    whyItWorks: 'Ocean sounds have a natural rhythm that mirrors our breathing patterns.',
    adaptiveReason: 'Recommended based on your recent anxiety patterns',
    isRecommended: true
  };

  return {
    ...baseSession,
    audioData: meditationAudioData[sessionId as keyof typeof meditationAudioData] || meditationAudioData['1'],
    emotionalFeedback: emotionalFeedbackData,
    progress: sessionProgressData,
    audioPlayer: mockAudioPlayer
  };
};

export default {
  meditationAudioData,
  emotionalFeedbackData,
  sessionProgressData,
  mockAudioPlayer,
  createMockMeditationSession
};
