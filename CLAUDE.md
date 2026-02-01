# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Neurotype is a React Native meditation app that adapts to brain types, using neuroscience-backed meditation methods to reduce anxiety. The app features 12 mental health modules (Anxiety, ADHD, Depression, etc.) with personalized daily recommendations, progress tracking, and emotional feedback.

## Development Commands

### Running the App
```bash
npm start              # Start Expo dev server
npm run ios            # Run on iOS simulator (uses expo run:ios for native builds)
npm run android        # Run on Android emulator (uses expo run:android for native builds)
npm run web            # Run in web browser
```

### Testing
```bash
npm test               # Run all tests with Jest
npm run test:watch     # Run tests in watch mode
```

### Database Migrations
```bash
npm run migrate:sessions   # Run session migration script (requires Supabase connection)
```

## Architecture Overview

### Backend Integration
- **Supabase** (PostgreSQL) for backend-as-a-service
- **Authentication**: Stored in expo-secure-store, managed by Supabase client
- **Service Layer Pattern**: All backend calls go through [src/services/](src/services/) files
- **Environment**: Requires `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env` file

### Critical Dependencies
- **expo-dev-client** (`^6.0.20`) - Custom development client for native features (required for Stripe, notifications, auth)
- **expo-updates** (`^29.0.16`) - Over-the-air updates for production
- **@stripe/stripe-react-native** (`^0.57.2`) - Native Stripe integration for payments
- **expo-notifications** (`^0.32.16`) - Cross-platform push notifications
- **expo-apple-authentication** (`^8.0.8`) - Apple Sign-In integration
- **expo-auth-session** (`^7.0.10`) - OAuth flow handling for Google Sign-In
- **expo-crypto** (`^15.0.8`) - Cryptographic operations for auth flows
- **react-native-reanimated** (`~4.1.1`) - Smooth animations (requires Babel plugin)

### State Management (Zustand)
**Store location**: [src/store/useStore.ts](src/store/useStore.ts)

The global store manages:
- **Session Caching**: Completed sessions, calendar data, technique effectiveness
- **User Progress**: Streak calculations, session deltas (before/after anxiety ratings)
- **UI State**: Active module, filters, liked sessions
- **Optimistic Updates**: UI updates immediately, backend syncs asynchronously

**Key pattern**: Services update the store, components consume from store. Never call services directly from components—use store actions.

### Service Layer
All services in [src/services/](src/services/) follow this pattern:
- Export async functions that call Supabase
- Handle errors and return typed data
- Update Zustand store on success
- Services are independent and can be called from store actions

**Key services**:
- `authService.ts` - Authentication (email, Google OAuth, Apple Sign-In)
- `sessionService.ts` - Fetch sessions from database
- `progressService.ts` - Track completions, calculate streaks
- `recommendationService.ts` - Generate daily personalized recommendations
- `userService.ts` - User preferences and profile management
- `feedbackService.ts` - Emotional feedback during sessions
- `paymentService.ts` - Stripe payment integration and subscription management
- `notificationService.ts` - Push notification scheduling and permissions
- `likedService.ts` - Session like/unlike functionality

### Navigation Structure
**Type**: React Navigation with custom Instagram-style animated headers

```
Tab Navigator (AnimatedTabBar)
├── Today Stack
│   ├── TodayMain (home screen)
│   ├── Roadmap (module journey)
│   └── MeditationDetail
├── Progress Stack (single screen)
├── Explore Stack
│   ├── ExploreMain (browse modules)
│   ├── ModuleDetail
│   └── MeditationDetail
└── Profile Stack
    ├── ProfileMain
    └── Settings

Modal Layer (fullscreen, no tabs)
├── MeditationPlayerScreen
├── TutorialPlayerScreen
├── OnboardingScreen
├── SplashScreen
├── SubscriptionScreen
├── PaymentScreen
└── SettingsScreen
```

**Important**: The Instagram-style navigation ([NAVIGATION_README.md](NAVIGATION_README.md)) uses a two-layer system:
1. **TopShell** - Always visible, pins to safe area
2. **RevealBar** - Slides under TopShell on scroll (1:1 movement)

When modifying screens that use `InstagramStyleNav`, maintain 1:1 scroll movement with no easing during scroll, and snap animations only on scroll end.

### Database Schema (Supabase)

**Core tables** (see [BACKEND_GUIDE.md](BACKEND_GUIDE.md) for full schema):
- `users` - User profiles (id, email, first_name, profile_icon, subscription_type, stripe_customer_id)
- `user_preferences` - User settings (reminder_enabled, reminder_time, dark_theme_enabled)
- `sessions` - Meditation session data (id, title, duration_minutes, description, why_it_works)
- `modules` - Mental health module definitions (id, name, description, color, category)
- `session_modalities` - Many-to-many relationship between sessions and modules
- `completed_sessions` - Completion tracking (user_id, session_id, context_module, completed_date, minutes_completed)
- `session_deltas` - Before/after anxiety ratings (user_id, session_id, module_id, before_rating, after_rating, date)
- `emotional_feedback` - Real-time emotional feedback during sessions (user_id, session_id, label, timestamp_seconds)
- `liked_sessions` - Favorited sessions (user_id, session_id)
- `daily_recommendations` - AI-generated daily recommendations (user_id, module_id, session_id, recommendation_date, rank)

**Row Level Security (RLS)**: All tables have RLS policies so users can only access their own data. When writing new queries, ensure they work within RLS constraints.

**Supabase Edge Functions** (for payment processing):
- `create-subscription` - Creates Stripe subscriptions for monthly/yearly plans
- `create-payment-intent` - Creates one-time payment intents for lifetime access
- `create-portal-session` - Creates Stripe customer portal sessions for subscription management
- `stripe-webhook` - Handles Stripe webhook events (subscription updates, cancellations)

These functions are deployed to Supabase and called from `paymentService.ts`.

### Data Flow Patterns

**Session Completion Flow**:
1. User starts session → opens `MeditationPlayerScreen` with `beforeRating`
2. During playback → records `EmotionalFeedbackEntry` in real-time
3. After completion → user provides `afterRating`
4. Save flow:
   - Call `markSessionCompleted` (progressService)
   - Call `addSessionDelta` (progressService)
   - Update Zustand store with new completion
   - Recalculate streak via `calculateUserStreak`
   - Invalidate caches (completed sessions, calendar)

**Daily Recommendations**:
- Generated via `ensureDailyRecommendations` in [App.tsx](App.tsx) on app start
- Stored in `daily_recommendations` table
- 3 sessions per module, ranked by recommendation algorithm
- Refreshed daily (checks `recommendation_date`)

**Caching Strategy**:
- Zustand store maintains caches for performance
- Cache invalidation happens on mutations (completions, likes, etc.)
- `getCompletedSessionsByDateRange` with cache check pattern
- Cache keys: `completedSessionsCache`, `calendarCache`

### Module System

**Mental Health Modules** ([src/data/modules.ts](src/data/modules.ts)):
- 12 modules across 3 categories: disorder (red), wellness (teal), skill (blue/green)
  - **Disorders (Red)**: Anxiety, ADHD, Depression, Bipolar, Panic, PTSD
  - **Wellness (Teal)**: Stress Relief, Better Sleep, Self-Compassion
  - **Skills (Blue/Green)**: Focus & Clarity, Emotional Regulation, Mindfulness
- Each module has: id, name, description, color, category, icon
- Sessions are tagged with `modalities` (many-to-many relationship via `session_modalities` table)
- Total of 217+ meditation sessions across all modules

**Background Color System**:
- Module colors create subtle backgrounds via `createSubtleBackground` in [useStore.ts](src/store/useStore.ts)
- Completion state uses `createCompletionBackground` with color theory
- Pre-rendered backgrounds for instant switching between modules

### Custom Components Architecture

**Largest/Most Complex Components**:
- [OnboardingScreen.tsx](src/screens/OnboardingScreen.tsx) (4,192 lines) - Multi-step onboarding flow
- [MeditationPlayerScreen.tsx](src/screens/MeditationPlayerScreen.tsx) (2,443 lines) - Full meditation experience with audio, emotional feedback, completion flow
- [ModuleRoadmap.tsx](src/components/ModuleRoadmap.tsx) (1,802 lines) - Visual journey/progress roadmap

**Component Patterns**:
- Use `theme.ts` for consistent styling (avoid hardcoded colors)
- Add `testID` props for primary CTAs (e.g., `start-session`, `save-session`)
- Prefer optimistic updates with rollback on error
- Use `react-native-reanimated` for animations, `useNativeDriver: true` for performance

## Important Implementation Notes

### Authentication
- Supabase auth tokens stored in `expo-secure-store` (secure, encrypted storage)
- Custom storage adapter in [src/services/supabase.ts](src/services/supabase.ts)
- **Authentication Methods**:
  - Email/password authentication
  - Google OAuth via `expo-auth-session`
  - Apple Sign-In via `expo-apple-authentication`
- Test user system exists (`ensureTestUser`) for development—don't rely on this in production

### Meditation Player
- Uses `expo-av` for audio playback
- Segments-based audio structure (intro, body, outro)
- Real-time emotional feedback slider during playback
- Haptic feedback on completion
- Before/after anxiety check-in (0-10 scale)

### Push Notifications
- **Expo Notifications**: Daily meditation reminders
- **Service**: `notificationService.ts` handles scheduling and permissions
- **User Settings**: Customizable reminder time in ProfileScreen/SettingsScreen
- **Implementation**: Uses `expo-notifications` for cross-platform push support
- Users can enable/disable and set custom reminder times
- Requires notification permissions on iOS/Android

### Subscription & Payment System
- **Stripe Integration**: Payment processing via `@stripe/stripe-react-native`
- **Tiers**: Basic (free), Premium Monthly ($9.99), Yearly ($79.99), Lifetime ($199.99)
- **Service Layer**: `paymentService.ts` handles Stripe checkout, subscriptions, and customer portal
- **Supabase Edge Functions**:
  - `create-subscription` - Creates Stripe subscriptions
  - `create-payment-intent` - One-time payment intents for lifetime access
  - `create-portal-session` - Customer portal access for subscription management
  - `stripe-webhook` - Webhook event handling for subscription updates
- **Subscription Management**: Users can upgrade/downgrade via SubscriptionScreen and PaymentScreen
- **Access Control**: Premium features locked based on `subscription_type` in users table

### Progress Tracking
- **Streak Calculation**: Consecutive days with at least one completed session
- **Session Deltas**: Tracks anxiety reduction (before - after rating)
- **Technique Effectiveness**: Groups by session modality, calculates avg reduction
- **Calendar**: Interactive calendar showing completion dates with color coding

### Styling & Theme
- Paper-like, Apple Health-inspired aesthetic
- Base background: `#f8f6f1` (cream/beige)
- Module-specific accent colors for visual categorization
- Uses custom `Sparkline` component for trend visualization
- Animations: 250ms open, 80ms close (fast, responsive feel)

### Test User Setup
On app start in [App.tsx](App.tsx):
1. `ensureTestUser()` creates test user if not exists
2. `verifyTestUserConnection()` checks connection
3. `ensureDailyRecommendations()` generates recommendations
4. `calculateUserStreak()` updates streak count

**For production**: Remove test user logic and implement proper onboarding/auth flow.

## Common Patterns

### Adding a New Service Function
1. Create function in appropriate service file (e.g., `src/services/progressService.ts`)
2. Use Supabase client from `src/services/supabase.ts`
3. Add TypeScript types in `src/types/index.ts`
4. Handle errors gracefully (return null or throw with context)
5. Update Zustand store action if needed

### Adding a New Screen
1. Create screen in `src/screens/`
2. Add to appropriate stack navigator in [App.tsx](App.tsx)
3. Use `InstagramStyleNav` or `TopNav` for header
4. Add TypeScript route params to navigation types
5. Consider testIDs for primary CTAs

### Modifying Session Completion Logic
**Critical**: Completion logic is distributed across multiple places:
- UI: `MeditationPlayerScreen.tsx` (save button, completion landing)
- Store: `useStore.ts` (addCompletedSession, updateProgress actions)
- Services: `progressService.ts` (markSessionCompleted, addSessionDelta, calculateUserStreak)

When modifying, ensure consistency across all three layers.

### Working with Dates
- Use JavaScript Date objects consistently
- Store dates as `DATE` type in PostgreSQL (not timestamp)
- Format: `YYYY-MM-DD` for database queries
- Timezone handling: Store in user's local timezone, not UTC
- **CRITICAL**: Avoid using `new Date().toISOString().split('T')[0]` as it converts to UTC first, causing timezone bugs where late-night completions appear as the next day. Use `date.toLocaleDateString('en-CA')` or create a utility function that respects local timezone instead.

## Code Quality Notes

### TypeScript
- Strict mode enabled (`tsconfig.json`)
- Define types in `src/types/index.ts`
- Avoid `any` type—use proper types or `unknown`
- Service functions should have explicit return types

### Performance
- Use `React.memo` for expensive components (e.g., `SessionCard`, `ModuleCard`)
- Animations use `useNativeDriver: true` wherever possible
- Scroll events use `scrollEventThrottle={1}` for responsiveness
- Cache database queries in Zustand store

### Testing
- Test files in `__tests__/` subdirectories (e.g., `src/store/__tests__/`)
- Use Jest with ts-jest preset
- TestIDs on primary CTAs: `start-session`, `start-from-explore`, `save-session`, `toggle-reminder`

## Environment Setup

Required environment variables in `.env`:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

**Never commit `.env` to git** (already in `.gitignore`).

## Migration Scripts

Database migration scripts in [scripts/](scripts/):
- `create_test_user.sql` - Creates test user for development
- `migrate_sessions.sql` - Migrates session data structure
- `setup_test_user_rls.sql` - Sets up RLS policies for test user
- `add_module_id_to_recommendations.sql` - Adds module_id column to recommendations

Run via Supabase SQL Editor or use the TypeScript migration runner.

## Design System

**Theme file**: [src/styles/theme.ts](src/styles/theme.ts)

Key values:
- Primary: `#000000` (black text)
- Background: `#f8f6f1` (cream/beige)
- Surface: `#ffffff` (white cards)
- Border radius: 6-20px
- Shadows: Small and medium variants
- Typography: System font, sizes 12-24px

**Module Colors**:
- Red family (Anxiety, ADHD, Depression, Bipolar, Panic, PTSD)
- Teal family (Stress Relief, Better Sleep, Self-Compassion)
- Blue/Green family (Focus & Clarity, Emotional Regulation, Mindfulness)

## Known Limitations

- Light mode only (dark theme UI toggle exists but not fully implemented)
- Mock audio URLs (need real meditation audio content)
- Test user system for development (production uses full auth system)
- No offline mode (requires network connection)
- No social features (sharing, community)
- Payment testing requires Stripe test mode keys

## Additional Documentation

- [README.md](README.md) - Project overview and setup
- [BACKEND_GUIDE.md](BACKEND_GUIDE.md) - Full backend implementation guide
- [NAVIGATION_README.md](NAVIGATION_README.md) - Instagram-style navigation details
- [MEDITATION_PLAYER_README.md](MEDITATION_PLAYER_README.md) - Player screen implementation
- [MOCK_DATA_README.md](MOCK_DATA_README.md) - Mock data structure
