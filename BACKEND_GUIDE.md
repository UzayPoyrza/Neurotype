# Backend Implementation Guide for Neurotype

## Overview

The Neurotype app uses **Supabase** as its backend service, providing a complete PostgreSQL database, authentication, real-time subscriptions, and edge functions for payment processing.

## Current Implementation Status

✅ **Fully Implemented**
- Supabase project setup and configuration
- Database schema with all required tables
- Row Level Security (RLS) policies
- Authentication system (email, Google OAuth, Apple Sign-In)
- API service layer with all endpoints
- Zustand store integration with API calls
- Stripe payment integration
- Push notification system
- Real-time data synchronization

## Backend Architecture

### Supabase Setup

The app uses Supabase for:
- **PostgreSQL Database** - All data storage
- **Authentication** - User auth with multiple providers
- **Real-time Subscriptions** - Live data updates
- **Edge Functions** - Serverless functions for payments
- **Storage** - Secure token storage via Expo SecureStore

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  profile_icon TEXT DEFAULT '👤',
  subscription_type TEXT DEFAULT 'basic' CHECK (subscription_type IN ('basic', 'premium')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### User Preferences Table
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  reminder_enabled BOOLEAN DEFAULT FALSE,
  reminder_time TIME,
  dark_theme_enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Sessions Table
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  technique TEXT NOT NULL,
  description TEXT,
  why_it_works TEXT,
  audio_url TEXT,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Session Modalities Table
```sql
CREATE TABLE session_modalities (
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  PRIMARY KEY (session_id, module_id)
);
```

#### Completed Sessions Table
```sql
CREATE TABLE completed_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  context_module TEXT,
  completed_date DATE NOT NULL,
  minutes_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, session_id, context_module, completed_date)
);
```

#### Session Deltas Table
```sql
CREATE TABLE session_deltas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  module_id TEXT,
  date DATE NOT NULL,
  before_rating INTEGER NOT NULL CHECK (before_rating >= 0 AND before_rating <= 10),
  after_rating INTEGER NOT NULL CHECK (after_rating >= 0 AND after_rating <= 10),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Emotional Feedback Table
```sql
CREATE TABLE emotional_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  label TEXT NOT NULL CHECK (label IN ('Bad', 'Meh', 'Okay', 'Good', 'Great')),
  timestamp_seconds INTEGER NOT NULL,
  feedback_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Liked Sessions Table
```sql
CREATE TABLE liked_sessions (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, session_id)
);
```

#### Recommendations Table
```sql
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  recommendation_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, module_id, recommendation_date)
);
```

#### Modules Table
```sql
CREATE TABLE modules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  category TEXT CHECK (category IN ('disorder', 'wellness', 'skill')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Service Layer

All backend interactions are handled through service files in `src/services/`:

### Authentication Service (`authService.ts`)
- `signUpWithEmail()` - Email/password registration
- `signInWithEmail()` - Email/password login
- `signInWithGoogle()` - Google OAuth
- `signInWithApple()` - Apple Sign-In
- `signOut()` - User logout
- `resetPassword()` - Password reset

### User Service (`userService.ts`)
- `getUserProfile()` - Get user profile
- `updateUserProfile()` - Update profile (name, icon)
- `getUserPreferences()` - Get user preferences
- `updateUserPreferences()` - Update preferences
- `isPremiumUser()` - Check premium status
- `getSubscriptionDetails()` - Get subscription info
- `createUserProfile()` - Create new user profile

### Session Service (`sessionService.ts`)
- `getAllSessions()` - Get all active sessions
- `getSessionById()` - Get single session
- `getSessionsByModality()` - Get sessions by module
- `getSessionModules()` - Get modules for a session

### Progress Service (`progressService.ts`)
- `markSessionCompleted()` - Mark session as completed
- `getCompletedSessionsByDateRange()` - Get completed sessions
- `isSessionCompleted()` - Check if session completed
- `calculateUserStreak()` - Calculate user streak
- `addSessionDelta()` - Record before/after rating

### Feedback Service (`feedbackService.ts`)
- `addEmotionalFeedback()` - Add emotional feedback
- `getUserEmotionalFeedback()` - Get feedback history
- `getUserEmotionalFeedbackWithSessions()` - Get feedback with session data
- `deleteEmotionalFeedback()` - Delete feedback entry

### Payment Service (`paymentService.ts`)
- `createPaymentIntent()` - Create one-time payment
- `createSubscription()` - Create recurring subscription

### Recommendation Service (`recommendationService.ts`)
- `ensureDailyRecommendations()` - Generate daily recommendations
- `getDailyRecommendations()` - Get today's recommendations

### Notification Service (`notificationService.ts`)
- `requestNotificationPermissions()` - Request permissions
- `scheduleDailyNotification()` - Schedule daily reminder
- `cancelAllNotifications()` - Cancel all notifications

### Liked Service (`likedService.ts`)
- `toggleLikedSession()` - Like/unlike a session
- `getLikedSessions()` - Get user's liked sessions

## Row Level Security (RLS)

All tables have RLS policies enabled to ensure users can only access their own data:

- Users can only read/update their own profile
- Users can only see their own completed sessions
- Users can only see their own feedback and progress
- Users can only manage their own preferences

## Authentication Flow

1. **Onboarding**: New users complete onboarding screen
2. **Sign In**: Users can sign in with email, Google, or Apple
3. **Session Restoration**: App automatically restores session on launch
4. **Profile Creation**: User profile created automatically on first sign-in
5. **Data Loading**: User data loaded from database on app open

## Data Synchronization

- **On App Open**: All user data synced from database
- **Real-time Updates**: Zustand store updated immediately for UI responsiveness
- **Optimistic Updates**: UI updates immediately, syncs to database in background
- **Cache Management**: Session and calendar caches cleared on app open for fresh data

## Security Considerations

1. **Row Level Security (RLS)**: Enabled on all tables
2. **API Keys**: Stored in environment variables, never committed
3. **Password Hashing**: Handled automatically by Supabase
4. **Input Validation**: All inputs validated on backend
5. **Secure Storage**: Auth tokens stored in Expo SecureStore
6. **HTTPS Only**: All API calls use HTTPS

## Edge Functions

Supabase Edge Functions handle payment processing:

### `create-subscription`
- Creates Stripe subscriptions for monthly/yearly plans
- Handles lifetime one-time payments
- Updates user subscription status in database

### `create-payment-intent`
- Creates Stripe Payment Intents for one-time payments
- Used for lifetime subscriptions

### `create-portal-session`
- Creates Stripe Customer Portal sessions
- Allows users to manage subscriptions

### `stripe-webhook`
- Handles Stripe webhook events
- Updates subscription status on payment events
- Handles subscription cancellations and renewals

## Testing

The app includes a test user system for development:
- Test user automatically created if needed
- Test user ID: `00000000-0000-0000-0000-000000000001`
- Can be used for testing without authentication

## Environment Variables

Required environment variables:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Deployment

### Supabase Edge Functions
Deploy edge functions using Supabase CLI:
```bash
supabase functions deploy create-subscription --project-ref your_project_ref
supabase functions deploy create-payment-intent --project-ref your_project_ref
supabase functions deploy create-portal-session --project-ref your_project_ref
supabase functions deploy stripe-webhook --project-ref your_project_ref
```

### Database Migrations
Run SQL migrations in Supabase Dashboard → SQL Editor

## Monitoring

- Check Supabase Dashboard for database metrics
- Monitor Edge Function logs in Supabase Dashboard
- Check Stripe Dashboard for payment events
- Review app logs for authentication and data sync issues

## Troubleshooting

### Common Issues

1. **Authentication fails**
   - Check Supabase URL and keys in environment variables
   - Verify RLS policies are correctly configured
   - Check network connectivity

2. **Data not syncing**
   - Verify user is logged in (check `userId` in store)
   - Check Supabase connection in logs
   - Verify RLS policies allow user access

3. **Payments not working**
   - Verify Stripe keys are set correctly
   - Check Edge Function logs
   - Verify webhook endpoint is configured in Stripe

4. **Notifications not working**
   - Check notification permissions
   - Verify notification service is initialized
   - Check device notification settings
