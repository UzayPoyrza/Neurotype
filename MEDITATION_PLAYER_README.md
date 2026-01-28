# Meditation Player Screen

A full-featured meditation player screen with immersive design, real-time emotional feedback, and comprehensive session tracking.

## Key Features

### Top Bar
- **Back Button**: Located on the top left for easy navigation
- **Tutorial Toggle**: Center button that toggles between "Do tutorial" and "Skip tutorial"
- **Like Button**: Heart icon to like/unlike sessions (saves to database)
- **Options Menu**: Triple dots (⋯) on the top right for additional options

### Main Content
- **Session Title**: Prominently displayed meditation title (truncated if too long)
- **Heart Icon**: Like/unlike functionality for sessions (❤️/🤍) - persists to database
- **Progress Bar**: Visual progress indicator with current and remaining time
- **Player Controls**: 
  - Play/Pause button (▶/⏸) with animated press feedback
  - Skip backward 10 seconds (⏪)
  - Skip forward 10 seconds (⏩)
  - Gesture-based seeking on progress bar

### Dynamic Bottom Section

#### During Playback
- **"How do you feel?" Bar**: Emotional feedback slider (0-10 scale) for real-time mood tracking
- **Guided Segments**: Displays current meditation instruction/segment
- **Auto-save Feedback**: Automatically saves emotional feedback every 30 seconds
- **Clean, minimal design** with subtle glassmorphism effect

#### When Paused/Finished
- **Finish Button**: Large, prominent button with shadow
- **Discard Session**: Secondary text button below finish button
- **Completion Landing**: Full-screen completion screen with rating and feedback
- **Feedback Landing**: Post-session feedback collection

### Session Completion Flow

1. **Completion Landing**: Appears when session is finished
   - Session rating (0-10 scale)
   - Optional feedback
   - Save to database
   - Mark session as completed

2. **Feedback Landing**: Optional post-session feedback
   - Emotional state tracking
   - Session effectiveness rating
   - Additional notes

3. **Database Integration**:
   - Saves session completion to `completed_sessions` table
   - Records before/after ratings to `session_deltas` table
   - Saves emotional feedback to `emotional_feedback` table
   - Updates user streak automatically

## Design Philosophy

### Immersive Experience
- Full-screen modal presentation
- Dark background with warm gradient overlay for ambiance
- High contrast white text for readability
- Smooth animations and transitions
- Focus-driven layout that minimizes distractions

### Module-Based Theming
- Background gradients adapt to module colors
- Progress bar colors match module theme
- Consistent visual identity across modules

## Technical Implementation

### State Management
- `playerState`: 'ready' | 'playing' | 'paused' | 'finished'
- Real-time progress tracking with animated progress bar
- Emotional rating system for mood tracking
- Session completion tracking
- Database integration for persistence

### Animations
- Progress bar animation using `Animated.Value` and `Reanimated`
- Play button press animation with scale effect
- Smooth transitions between states
- Gesture-based seeking with spring animations
- Emotional feedback bar slide-in/out animations

### Audio Playback
- Mock audio player for development (`mockAudioPlayer`)
- Real-time progress tracking
- Play/pause/stop controls
- Seeking functionality (skip forward/backward)
- Audio loading states

### Components Used
- `Slider0to10`: Enhanced with `showLabels` prop for minimal display
- `MeditationCompletionLanding`: Post-session completion screen
- `MeditationFeedbackLanding`: Post-session feedback screen
- Custom styling for meditation context
- `SafeAreaView` for proper iOS integration

### Database Integration
- **Session Completion**: Saves to `completed_sessions` table
- **Session Ratings**: Saves before/after ratings to `session_deltas`
- **Emotional Feedback**: Real-time feedback saved to `emotional_feedback` table
- **Liked Sessions**: Like/unlike saved to `liked_sessions` table
- **Cache Updates**: Updates local Zustand store cache immediately

## Usage

The meditation player screen is automatically displayed when a meditation session is active. It provides a full-screen, immersive experience for meditation practice with intuitive controls and comprehensive feedback collection.

### Opening the Player
```typescript
// Set active session in store
setActiveSession(session);
setActiveModuleId(moduleId);
```

### Player States
- **Ready**: Initial state, shows play button
- **Playing**: Audio playing, shows pause button and emotional feedback bar
- **Paused**: Audio paused, shows play button and finish/discard buttons
- **Finished**: Session complete, shows completion landing

## File Structure

- `src/screens/MeditationPlayerScreen.tsx`: Main player screen component
- `src/screens/TutorialPlayerScreen.tsx`: Tutorial-specific player variant
- `src/components/Slider0to10.tsx`: Enhanced slider component
- `src/components/MeditationCompletionLanding.tsx`: Completion screen
- `src/components/MeditationFeedbackLanding.tsx`: Feedback screen
- `src/data/meditationMockData.ts`: Mock audio data and player
- `src/services/ratingService.ts`: Session rating service
- `src/services/feedbackService.ts`: Emotional feedback service
- `App.tsx`: Modal wrapper for player screen

## Mock Data

The player uses mock audio data for development:
- Realistic meditation session segments
- Guided instruction text
- Timing information
- Background audio simulation

See `MOCK_DATA_README.md` for detailed information about mock data structure.

## Future Enhancements

- [ ] Real audio file integration (replace mock player)
- [ ] Background audio playback
- [ ] More sophisticated emotional tracking
- [ ] Session history and analytics
- [ ] Customizable themes and backgrounds
- [ ] Social sharing features
- [ ] Offline mode support
- [ ] Audio quality settings
- [ ] Playback speed control

## Integration Points

### Zustand Store
- `activeSession`: Current playing session
- `activeModuleId`: Current module context
- `markSessionCompletedToday()`: Mark session as completed
- `toggleLikedSession()`: Like/unlike session
- `addEmotionalFeedbackEntry()`: Add feedback entry

### Services
- `ratingService.addSessionRating()`: Save session rating
- `feedbackService.addEmotionalFeedback()`: Save emotional feedback
- `progressService.markSessionCompleted()`: Mark session complete

### Navigation
- Modal presentation from `App.tsx`
- Back button closes player and returns to previous screen
- Completion landing can navigate to progress screen
