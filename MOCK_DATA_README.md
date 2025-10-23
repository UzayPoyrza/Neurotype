# Meditation Player Mock Data

I've created realistic mock data for testing the meditation player functionality. Here's what's included:

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

### Player States:
- ✅ **Ready**: Shows initial meditation setup
- ✅ **Playing**: Displays guided segments + "How do you feel?" slider
- ✅ **Paused**: Shows Finish/Discard buttons
- ✅ **Finished**: Session complete with action buttons

### Mock Audio Player:
- ✅ **Play/Pause/Stop**: Full audio control simulation
- ✅ **Seeking**: Jump to specific times
- ✅ **Volume Control**: Adjustable audio levels
- ✅ **Loading States**: Realistic audio loading simulation

## 📊 Data Tracking

The mock data includes:

### Emotional Feedback:
- Tracks mood ratings every 30 seconds during playback
- Stores emotional state changes
- Provides average improvement statistics

### Session Progress:
- Records completion times and ratings
- Tracks session statistics (completions, ratings, last session)
- Simulates user progress data

### Audio Analytics:
- Mock audio file loading and playback
- Realistic timing and duration tracking
- Volume and seeking functionality

## 🔧 Technical Details

### File Structure:
```
src/data/meditationMockData.ts
├── meditationAudioData     # Audio segments and timing
├── emotionalFeedbackData   # Mood tracking
├── sessionProgressData     # Completion tracking  
├── mockAudioPlayer        # Audio player simulation
└── createMockMeditationSession # Session factory
```

### Integration:
- Automatically loads when meditation player opens
- Provides realistic timing and content
- Tracks all user interactions
- Simulates real meditation app behavior

## 🚀 Next Steps

This mock data provides a complete foundation for:
1. **Real Audio Integration**: Replace mock audio with actual meditation tracks
2. **Backend Integration**: Connect to real meditation content APIs
3. **Analytics**: Implement real user progress tracking
4. **Personalization**: Add adaptive content based on user preferences

The meditation player now has realistic, testable functionality that closely mimics a real meditation app experience!
