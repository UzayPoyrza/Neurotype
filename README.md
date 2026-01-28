# Neurotype

The first meditation app that adapts to your brain type, using neuroscience to match you with the meditation method proven to work for you.

## Features

### 🎯 Core Loop
- **Pick a session** → **Record before/after feeling** → **See your trend**
- Simple, fast, and clean meditation experience
- Anxiety reduction tracking (0-10 scale)
- Real-time emotional feedback during sessions

### 📱 Four Main Tabs

#### Today Tab
- Personalized greeting with streak counter
- Daily recommended sessions based on selected module
- Module selection (Anxiety, ADHD, Depression, Stress, Sleep, Focus, etc.)
- Mini trend sparkline showing last 7 sessions
- Quick stats overview
- Module roadmap view

#### Progress Tab
- Session completion calendar
- Streak tracking
- Technique effectiveness analytics
- Progress trends and statistics

#### Explore Tab
- Browse all available sessions across all modules
- Filter by modality (Sound, Movement, Mantra, Visualization, Somatic, Mindfulness)
- Filter by goal and module
- Session cards with duration and tags
- Module detail views
- Search functionality

#### Profile Tab
- Personal stats (streak, sessions completed, avg reduction)
- Subscription management (Basic/Premium)
- Daily reminder settings with customizable time
- App settings and information
- Account management

### 🧠 Session Experience
- Before/after anxiety check-in (0-10 scale)
- Timer-based meditation sessions with guided audio
- Real-time emotional feedback slider during playback
- Haptic feedback on completion
- Progress tracking and trends
- Session completion tracking across modules
- Like/unlike sessions

### 🎓 Modules System
The app includes 13 mental health modules organized by category:

**Disorders** (Red):
- Anxiety (18 sessions)
- ADHD (14 sessions)
- Depression (22 sessions)
- Bipolar Disorder (12 sessions)
- Panic Disorder (16 sessions)
- PTSD (19 sessions)

**Wellness** (Teal):
- Stress Relief (25 sessions)
- Better Sleep (20 sessions)
- Self-Compassion (11 sessions)

**Skills** (Green):
- Focus & Clarity (17 sessions)
- Emotional Regulation (15 sessions)
- Mindfulness (28 sessions)

### 💳 Subscription System
- **Basic**: Free tier with limited access
- **Premium**: Full access to all sessions
  - Monthly subscription ($9.99/month)
  - Yearly subscription ($79.99/year)
  - Lifetime subscription ($199.99 one-time)
- Stripe integration for secure payments
- Subscription management portal
- Automatic renewal handling

### 🔔 Notifications
- Daily reminder notifications
- Customizable reminder time
- Push notification support via Expo Notifications

## Tech Stack

- **Expo SDK 54** with React Native 0.81.5
- **TypeScript** for type safety
- **React Navigation 7** for bottom tabs and stack navigation
- **NativeWind** for styling (Tailwind CSS)
- **Zustand** for state management
- **Supabase** for backend (PostgreSQL database, authentication, real-time)
- **Stripe React Native** for payment processing
- **Expo AV** for audio playback
- **Expo Notifications** for push notifications
- **Expo Secure Store** for secure token storage
- **Phosphor Icons** for beautiful icons
- **React Native Reanimated** for smooth animations

## Backend Architecture

The app uses **Supabase** as the backend service:

- **Authentication**: Email/password, Google OAuth, Apple Sign-In
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Real-time**: Supabase real-time subscriptions
- **Storage**: Secure token storage via Expo SecureStore
- **Edge Functions**: Supabase Edge Functions for payment processing

### Key Services
- `authService.ts` - Authentication (login, signup, OAuth)
- `userService.ts` - User profiles and preferences
- `sessionService.ts` - Meditation session data
- `progressService.ts` - Session completion and streak tracking
- `feedbackService.ts` - Emotional feedback tracking
- `paymentService.ts` - Stripe payment integration
- `recommendationService.ts` - Daily session recommendations
- `notificationService.ts` - Push notification scheduling
- `likedService.ts` - Session like/unlike functionality

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Expo CLI
- iOS Simulator or Android Emulator
- Supabase account and project
- Stripe account (for payments)

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

3. Set up environment variables:
Create a `.env` file in the root directory:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

4. Start the development server:
```bash
npm start
```

5. Run on your preferred platform:
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
│   ├── AnimatedTabBar.tsx # Custom animated bottom tab bar
│   ├── AnimatedFloatingButton.tsx # Floating action button
│   ├── Chip.tsx        # Filter and tag chips
│   ├── PrimaryButton.tsx # Main action buttons
│   ├── SessionCard.tsx # Session display cards
│   ├── ModuleCard.tsx  # Module display cards
│   ├── Slider0to10.tsx # Anxiety scale slider
│   ├── Sparkline.tsx   # Progress trend visualization
│   ├── TopNav.tsx      # Top navigation component
│   ├── InstagramStyleNav.tsx # Instagram-style scrollable nav
│   ├── SpotifyFilterBar.tsx # Spotify-style filter bar
│   └── icons/          # Icon components
├── screens/            # Main app screens
│   ├── SplashScreen.tsx # App splash screen
│   ├── OnboardingScreen.tsx # User onboarding
│   ├── TodayScreen.tsx # Home tab with recommendations
│   ├── ProgressScreen.tsx # Progress and analytics
│   ├── ExploreScreen.tsx # Session browser
│   ├── ProfileScreen.tsx # User profile and stats
│   ├── SettingsScreen.tsx # App settings
│   ├── SubscriptionScreen.tsx # Subscription management
│   ├── PaymentScreen.tsx # Payment processing
│   ├── MeditationPlayerScreen.tsx # Session player
│   ├── TutorialPlayerScreen.tsx # Tutorial player
│   ├── MeditationDetailScreen.tsx # Session details
│   ├── ModuleDetailScreen.tsx # Module details
│   └── RoadmapScreen.tsx # Module roadmap
├── services/           # Backend service layer
│   ├── supabase.ts     # Supabase client configuration
│   ├── authService.ts  # Authentication
│   ├── userService.ts  # User management
│   ├── sessionService.ts # Session data
│   ├── progressService.ts # Progress tracking
│   ├── feedbackService.ts # Emotional feedback
│   ├── paymentService.ts # Stripe payments
│   ├── recommendationService.ts # Recommendations
│   ├── notificationService.ts # Notifications
│   ├── likedService.ts # Session likes
│   └── stripe.ts       # Stripe initialization
├── store/              # State management
│   └── useStore.ts     # Zustand store
├── types/              # TypeScript definitions
│   └── index.ts        # App type definitions
├── data/               # Static data
│   ├── modules.ts      # Mental health modules
│   ├── mockData.ts     # Sample data (legacy)
│   └── meditationMockData.ts # Meditation mock data
├── styles/             # Styling
│   └── theme.ts        # Theme configuration
└── utils/              # Utility functions
    ├── errorHandler.ts # Error handling
    └── gradientBackgrounds.ts # Gradient utilities
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
  description?: string;
  whyItWorks?: string;
  isRecommended?: boolean;
  isTutorial?: boolean;
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
  techniqueEffectiveness: {
    techniqueId: string;
    techniqueName: string;
    effectiveness: number | null;
  }[];
};
```

### Mental Health Module
```typescript
type MentalHealthModule = {
  id: string;
  title: string;
  description: string;
  color: string;
  icon?: string;
  meditationCount: number;
  category: 'disorder' | 'wellness' | 'skill';
};
```

## Testing

The app includes testIDs on primary CTAs for automated testing:
- `start-session` - Recommended session start button
- `start-from-explore` - Explore tab session start buttons
- `save-session` - Save session after completion
- `toggle-reminder` - Profile reminder toggle

## Development Notes

- **Light mode only** - Dark theme toggle exists but not fully implemented
- **Backend integrated** - Full Supabase backend with authentication and data persistence
- **Real sessions** - Sessions loaded from Supabase database
- **Dynamic recommendations** - Daily recommendations generated based on user progress
- **Authentication** - Full auth system with email, Google, and Apple Sign-In
- **Test user support** - Test user system for development

## Database Schema

The app uses Supabase PostgreSQL with the following main tables:
- `users` - User profiles and subscription info
- `user_preferences` - User settings and preferences
- `sessions` - Meditation session data
- `session_modalities` - Session-to-module relationships
- `completed_sessions` - Session completion tracking
- `session_deltas` - Before/after anxiety ratings
- `emotional_feedback` - Real-time emotional feedback during sessions
- `liked_sessions` - User liked sessions
- `recommendations` - Daily session recommendations
- `modules` - Mental health module definitions

## Environment Setup

### Required Environment Variables
- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key

### Supabase Edge Functions
The app uses Supabase Edge Functions for payment processing:
- `create-subscription` - Creates Stripe subscriptions
- `create-payment-intent` - Creates one-time payment intents
- `create-portal-session` - Creates Stripe customer portal sessions
- `stripe-webhook` - Handles Stripe webhook events

## Future Enhancements

- [ ] Dark mode full implementation
- [ ] Real audio/video content integration
- [ ] Advanced analytics dashboard
- [ ] Social features (sharing, community)
- [ ] GAD-7 assessment integration
- [ ] Scientific citations for techniques
- [ ] Offline mode support
- [ ] Advanced personalization with AI/ML
- [ ] Multi-language support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
