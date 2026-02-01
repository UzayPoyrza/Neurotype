# Neurotype

A React Native meditation app that adapts to your brain type, using neuroscience-backed methods to reduce anxiety. Built with Expo, TypeScript, Supabase, and Stripe.

## Screenshots

<p align="center">
  <img src="screenshots/today.png" width="150" alt="Today Screen" />
  <img src="screenshots/explore.png" width="150" alt="Explore Modules" />
  <img src="screenshots/modules.png" width="150" alt="Module Selection" />
  <img src="screenshots/detail.png" width="150" alt="Session Detail" />
  <img src="screenshots/player.png" width="150" alt="Meditation Player" />
  <img src="screenshots/profile.png" width="150" alt="Profile & History" />
</p>

## Overview

Neurotype helps users manage mental health through personalized meditation. The app features:

- **12 mental health modules** across disorders (Anxiety, ADHD, Depression), wellness (Sleep, Stress), and skills (Focus, Mindfulness)
- **217+ meditation sessions** with varied modalities (visualization, somatic, movement, sound)
- **Before/after tracking** to measure anxiety reduction over time
- **Daily personalized recommendations** based on user progress and selected focus area
- **Real-time emotional feedback** captured during meditation sessions

## Technical Highlights

### Architecture
- **Service layer pattern** - All backend calls go through typed service functions, keeping components clean
- **Zustand for state** - Global store with optimistic updates and cache invalidation
- **Row Level Security** - Supabase RLS policies ensure users only access their own data

### Key Technical Decisions
- **expo-secure-store** for auth token storage instead of AsyncStorage
- **React Navigation 7** with custom Instagram-style animated headers (1:1 scroll movement)
- **Supabase Edge Functions** for Stripe payment processing (subscriptions, one-time payments, webhooks)
- **Real-time emotional feedback** stored with timestamps during playback for session analytics

### Authentication
- Email/password, Google OAuth, and Apple Sign-In
- Custom storage adapter integrating expo-secure-store with Supabase client

### Payment Integration
- Stripe subscriptions (monthly/yearly) and one-time lifetime purchase
- Customer portal for subscription management
- Webhook handling for subscription state changes

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React Native 0.81 with Expo SDK 54 |
| Language | TypeScript |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| State | Zustand |
| Navigation | React Navigation 7 |
| Payments | Stripe React Native |
| Audio | Expo AV |
| Notifications | Expo Notifications |
| Animations | React Native Reanimated |

## Project Structure

```
src/
├── components/     # Reusable UI (SessionCard, AnimatedTabBar, Sparkline, etc.)
├── screens/        # App screens (Today, Progress, Explore, Profile, Player)
├── services/       # Backend service layer (auth, sessions, progress, payments)
├── store/          # Zustand global state
├── types/          # TypeScript definitions
└── styles/         # Theme configuration
```

## Database Schema

Core tables with Row Level Security:
- `users` - Profiles with subscription info and Stripe customer ID
- `sessions` - Meditation content with duration, description, and technique explanations
- `session_modalities` - Many-to-many relationship linking sessions to modules
- `completed_sessions` - Completion tracking with context module
- `session_deltas` - Before/after anxiety ratings (0-10 scale)
- `emotional_feedback` - Real-time feedback captured during sessions
- `daily_recommendations` - AI-generated daily session recommendations

## Getting Started

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your Supabase URL, anon key, and Stripe publishable key

# Start development server
npm start

# Run on iOS/Android
npm run ios
npm run android
```

## Features in Development

- Dark mode (UI exists, full implementation pending)
- Offline mode with local caching
- Advanced analytics dashboard
- Multi-language support

## License

MIT
