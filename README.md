# Neurotype

The first meditation app that adapts to your brain type, using neuroscience to match you with the meditation method proven to work for you.

## Features

### 🎯 Core Loop
- **Pick a session** → **Record before/after feeling** → **See your trend**
- Simple, fast, and clean meditation experience
- Anxiety reduction tracking (0-10 scale)

### 📱 Three Main Tabs

#### Today Tab
- Personalized greeting with streak counter
- Recommended session card
- Mini trend sparkline showing last 7 sessions
- Quick stats overview

#### Explore Tab
- Browse all available sessions
- Filter by modality (Sound, Movement, Mantra, etc.)
- Filter by goal (Anxiety, Focus, Sleep)
- Session cards with duration and tags

#### Profile Tab
- Personal stats (streak, sessions completed, avg reduction)
- Your neurotype information
- Daily reminder toggle
- App information

### 🧠 Session Experience
- Before/after anxiety check-in (0-10 scale)
- Timer-based meditation sessions
- Haptic feedback on completion
- Progress tracking and trends

## Tech Stack

- **Expo SDK 51+** with React Native
- **TypeScript** for type safety
- **React Navigation** for bottom tabs
- **NativeWind** for styling (Tailwind CSS)
- **Zustand** for state management
- **Phosphor Icons** for beautiful icons

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Neurotype
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Chip.tsx        # Filter and tag chips
│   ├── PrimaryButton.tsx # Main action buttons
│   ├── SessionCard.tsx # Session display cards
│   ├── Slider0to10.tsx # Anxiety scale slider
│   └── Sparkline.tsx   # Progress trend visualization
├── screens/            # Main app screens
│   ├── TodayScreen.tsx # Home tab with recommendations
│   ├── ExploreScreen.tsx # Session browser
│   ├── ProfileScreen.tsx # User profile and stats
│   └── PlayerScreen.tsx # Session experience modal
├── store/              # State management
│   └── useStore.ts     # Zustand store
├── types/              # TypeScript definitions
│   └── index.ts        # App type definitions
└── data/               # Mock data
    └── mockData.ts     # Sample sessions and user data
```

## Data Models

### Session
```typescript
type Session = {
  id: string;
  title: string;
  durationMin: number;
  modality: 'sound' | 'movement' | 'mantra' | 'visualization' | 'somatic' | 'mindfulness';
  goal: 'anxiety' | 'focus' | 'sleep';
};
```

### User Progress
```typescript
type UserProgress = {
  streak: number;
  sessionDeltas: {
    date: string;
    before: number;
    after: number;
  }[];
};
```

## Testing

The app includes testIDs on primary CTAs for automated testing:
- `start-session` - Recommended session start button
- `start-from-explore` - Explore tab session start buttons
- `save-session` - Save session after completion
- `toggle-reminder` - Profile reminder toggle

## Development Notes

- **Light mode only** - No dark theme implementation yet
- **In-memory data** - No backend or persistence
- **Mock sessions** - 12 pre-seeded sessions covering all modalities
- **Static recommendations** - No AI/ML yet
- **No authentication** - Single user experience

## Future Enhancements

- [ ] Dark mode support
- [ ] Backend integration
- [ ] Real video content
- [ ] Push notifications
- [ ] GAD-7 assessment
- [ ] Scientific citations
- [ ] User authentication
- [ ] Advanced analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 