# Meditation Player Mock Data

Realistic mock data for testing the meditation player functionality during development.

## 🎵 Audio Data (`meditationAudioData`)

### Available Sessions with Full Audio Mock Data:

1. **Ocean Waves Meditation** (5 min) - `sessionId: '1'`
   - 7 guided segments with realistic timing
   - Background audio: `ocean_waves.mp3`
   - Perfect for anxiety relief

2. **Gentle Stretching Flow** (8 min) - `sessionId: '2'`
   - 10 movement segments with detailed instructions
   - Background audio: `gentle_music.mp3`
   - Great for focus and energy

3. **Om Mantra Practice** (10 min) - `sessionId: '3'`
   - 12 segments including chanting and silence
   - Background audio: `om_chanting.mp3`
   - Ideal for sleep preparation

4. **Mountain Visualization** (6 min) - `sessionId: '4'`
   - 9 visualization segments
   - Background audio: `mountain_wind.mp3`
   - Excellent for anxiety and grounding

5. **Body Scan Journey** (12 min) - `sessionId: '5'`
   - 19 detailed body awareness segments
   - Background audio: `soft_bells.mp3`
   - Perfect for deep relaxation

6. **Breath Awareness** (7 min) - `sessionId: '6'`
   - 10 mindful breathing segments
   - Background audio: `soft_rain.mp3`
   - Great for sleep and focus

## 🎯 How to Test

### Natural App Flow
1. **Navigate to any meditation** in the app (Today screen or Explore screen)
2. **Tap on a meditation** to open the MeditationDetailScreen
3. **Click "Start" or "Tutorial"** button at the bottom
4. **The meditation player opens** with realistic mock data and guided content

### Available Sessions with Mock Data:
- **Ocean Waves Meditation** (5 min) - Anxiety relief with guided segments
- **Gentle Stretching Flow** (8 min) - Movement with detailed instructions
- **Om Mantra Practice** (10 min) - Sleep preparation with chanting
- **Mountain Visualization** (6 min) - Anxiety relief with visualization
- **Body Scan Journey** (12 min) - Deep relaxation with body awareness
- **Breath Awareness** (7 min) - Sleep and focus with mindful breathing

## 🎮 What You Can Test

### Realistic Functionality:
- ✅ **Audio Loading**: Mock audio files load with realistic timing
- ✅ **Guided Segments**: Real meditation instructions appear during playback
- ✅ **Progress Tracking**: Accurate timing and progress bars
- ✅ **Emotional Feedback**: Tracks mood every 30 seconds
- ✅ **Session Completion**: Saves progress and statistics
- ✅ **Like/Unlike**: Like sessions and save to database
- ✅ **Seeking**: Skip forward/backward 10 seconds
- ✅ **Play/Pause**: Full playback control

### Player States:
- ✅ **Ready**: Shows initial meditation setup
- ✅ **Playing**: Displays guided segments + "How do you feel?" slider
- ✅ **Paused**: Shows Finish/Discard buttons
- ✅ **Finished**: Session complete with completion landing

### Mock Audio Player:
- ✅ **Play/Pause/Stop**: Full audio control simulation
- ✅ **Seeking**: Jump to specific times
- ✅ **Volume Control**: Adjustable audio levels (not exposed in UI)
- ✅ **Loading States**: Realistic audio loading simulation
- ✅ **Progress Callbacks**: Real-time progress updates

## 📊 Data Tracking

The mock data includes:

### Emotional Feedback:
- Tracks mood ratings every 30 seconds during playback
- Stores emotional state changes
- Provides average improvement statistics
- Saves to database via `feedbackService`

### Session Progress:
- Records completion times and ratings
- Tracks session statistics (completions, ratings, last session)
- Simulates user progress data
- Saves to database via `progressService`

### Audio Analytics:
- Mock audio file loading and playback
- Realistic timing and duration tracking
- Volume and seeking functionality
- Progress callbacks for UI updates

## 🔧 Technical Details

### File Structure:
```
src/data/meditationMockData.ts
├── meditationAudioData     # Audio segments and timing
├── emotionalFeedbackData   # Mood tracking (legacy)
├── sessionProgressData     # Completion tracking (legacy)
├── mockAudioPlayer        # Audio player simulation
└── createMockMeditationSession # Session factory
```

### Mock Audio Player API:
```typescript
interface MockAudioPlayer {
  play(): void;
  pause(): void;
  stop(): void;
  seekTo(time: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  setVolume(volume: number): void;
  onProgress(callback: (time: number) => void): void;
  onEnd(callback: () => void): void;
}
```

### Integration:
- Automatically loads when meditation player opens
- Provides realistic timing and content
- Tracks all user interactions
- Simulates real meditation app behavior
- Integrates with database services for persistence

## 🗄️ Database Integration

While the player uses mock audio data, all user interactions are saved to the database:

- **Session Completion**: Saved to `completed_sessions` table
- **Session Ratings**: Saved to `session_deltas` table (before/after ratings)
- **Emotional Feedback**: Saved to `emotional_feedback` table (real-time feedback)
- **Liked Sessions**: Saved to `liked_sessions` table

## 🚀 Migration to Real Audio

When ready to integrate real audio:

1. **Replace Mock Player**: Replace `mockAudioPlayer` with real audio player (Expo AV)
2. **Update Audio URLs**: Use real audio URLs from database (`sessions.audio_url`)
3. **Update Segments**: Load guided segments from database or API
4. **Remove Mock Data**: Remove `meditationMockData.ts` or keep for fallback

### Example Migration:
```typescript
// Replace mock player
import { Audio } from 'expo-av';

const sound = new Audio.Sound();
await sound.loadAsync({ uri: session.audio_url });
await sound.playAsync();
```

## 📝 Notes

- Mock data is used for development and testing
- All user data (completions, ratings, feedback) is saved to real database
- Mock audio player simulates real audio behavior
- Guided segments are realistic meditation instructions
- Timing matches real meditation session durations

The meditation player now has realistic, testable functionality that closely mimics a real meditation app experience while maintaining full database integration for user data!
