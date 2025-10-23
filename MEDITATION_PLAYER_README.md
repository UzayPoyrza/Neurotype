# Meditation Player Screen

A new meditation player screen inspired by the provided screenshot but adapted to iOS Apple Health style with a calm, minimal, focus-driven aesthetic.

## Key Features

### Top Bar
- **Back Button**: Located on the top left for easy navigation
- **Tutorial Toggle**: Center button that toggles between "Do tutorial" and "Skip tutorial"
- **Options Menu**: Triple dots (⋯) on the top right for additional options

### Main Content
- **Session Title**: Prominently displayed meditation title
- **Heart Icon**: Like/unlike functionality for sessions (❤️/🤍)
- **Artist/Creator**: "Prashanti Paz" displayed below the title
- **Progress Bar**: Visual progress indicator with current and remaining time
- **Player Controls**: 
  - Music note (♪)
  - Previous track (⏮)
  - Play/Pause button (▶/⏸) with animated press feedback
  - Next track (⏭)
  - Repeat/Shuffle (🔁)

### Dynamic Bottom Section

#### During Playback
- **"How do you feel?" Bar**: Emotional feedback slider (0-10 scale) for real-time mood tracking
- Clean, minimal design with subtle glassmorphism effect

#### When Paused/Finished
- **Finish Button**: Large, prominent white button with shadow
- **Discard Session**: Secondary text button below finish button

## Design Philosophy

### iOS Apple Health Style
- Clean, minimal interface with focus on content
- Subtle shadows and rounded corners
- Consistent spacing and typography
- Calm color palette with warm brown overlay

### Meditation-Focused Aesthetic
- Dark background with warm overlay for ambiance
- High contrast white text for readability
- Smooth animations and transitions
- Focus-driven layout that minimizes distractions

## Technical Implementation

### State Management
- `playerState`: 'ready' | 'playing' | 'paused' | 'finished'
- Real-time progress tracking with animated progress bar
- Emotional rating system for mood tracking

### Animations
- Progress bar animation using `Animated.Value`
- Play button press animation with scale effect
- Smooth transitions between states

### Components Used
- `Slider0to10`: Enhanced with `showLabels` prop for minimal display
- Custom styling for meditation context
- SafeAreaView for proper iOS integration

## Usage

The meditation player screen is automatically displayed when a meditation session is active. It provides a full-screen, immersive experience for meditation practice with intuitive controls and emotional feedback collection.

## File Structure

- `src/screens/MeditationPlayerScreen.tsx`: Main player screen component
- `src/components/Slider0to10.tsx`: Enhanced slider component
- `App.tsx`: Updated to use new player screen

## Future Enhancements

- Background audio integration
- More sophisticated emotional tracking
- Session history and analytics
- Customizable themes and backgrounds
- Social sharing features
