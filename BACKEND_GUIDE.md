# Backend Implementation Guide for Neurotype

## Overview

Your Neurotype app is currently using mock data stored in Zustand. To make it production-ready, you need to implement a backend that handles:

1. **User Authentication** (login/register/social auth)
2. **User Data Persistence** (profile, progress, preferences)
3. **Session Tracking** (completed sessions, feedback, progress)
4. **Analytics** (streaks, effectiveness tracking)

## Backend Architecture Options

### Option 1: Firebase (Recommended for Quick Start)
**Pros:**
- Quick setup (1-2 days)
- Built-in authentication (email, Google, Apple, Facebook)
- Real-time database (Firestore)
- Free tier is generous
- No server management

**Cons:**
- Vendor lock-in
- Less control over data
- Pricing can scale up

### Option 2: Supabase (Recommended for Full Control)
**Pros:**
- Open source
- PostgreSQL database
- Built-in authentication
- Real-time subscriptions
- Generous free tier
- More control than Firebase

**Cons:**
- Slightly more setup than Firebase
- Still a managed service

### Option 3: Custom Backend (Node.js/Express + PostgreSQL)
**Pros:**
- Full control
- Can host anywhere
- Most flexible

**Cons:**
- More development time
- Need to manage infrastructure
- Need to implement auth yourself

### Option 4: Backend-as-a-Service (AWS Amplify, Azure, etc.)
**Pros:**
- Enterprise-grade
- Scalable

**Cons:**
- More complex setup
- Can be expensive

## Recommended Approach: Supabase

I recommend **Supabase** because it:
- Provides everything you need out of the box
- Uses PostgreSQL (standard SQL database)
- Has excellent React Native support
- Is free for development
- Easy to migrate away from if needed

## Required API Endpoints

Based on your app structure, here are the endpoints you need:

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user
- `POST /auth/social/{provider}` - Social login (Google, Apple, Facebook)
- `POST /auth/forgot-password` - Password reset

### User Profile
- `GET /users/me` - Get user profile
- `PATCH /users/me` - Update user profile (firstName, profileIcon)
- `GET /users/me/preferences` - Get user preferences
- `PATCH /users/me/preferences` - Update preferences (reminders, theme, subscription)

### Sessions & Progress
- `GET /sessions` - Get all sessions (can be cached/static)
- `GET /sessions/:id` - Get session details
- `POST /sessions/:id/complete` - Mark session as completed
- `GET /sessions/completed` - Get user's completed sessions
- `POST /sessions/:id/like` - Like/unlike a session

### Progress Tracking
- `GET /progress` - Get user progress (streaks, sessionDeltas, etc.)
- `POST /progress/session-delta` - Record session delta (before/after)
- `GET /progress/streak` - Get current streak
- `GET /progress/effectiveness` - Get technique effectiveness data

### Emotional Feedback
- `POST /feedback` - Add emotional feedback entry
- `GET /feedback` - Get feedback history
- `DELETE /feedback/:id` - Remove feedback entry

### Modules
- `GET /modules` - Get all modules (can be cached/static)

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  profile_icon TEXT DEFAULT '👤',
  subscription_type TEXT DEFAULT 'basic' CHECK (subscription_type IN ('basic', 'premium')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### User Preferences Table
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  reminder_enabled BOOLEAN DEFAULT FALSE,
  dark_theme_enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Session Deltas Table
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
CREATE INDEX idx_session_deltas_user_date ON session_deltas(user_id, date DESC);
```

### Completed Sessions Table
```sql
CREATE TABLE completed_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  completed_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, session_id, module_id, completed_date)
);
CREATE INDEX idx_completed_sessions_user ON completed_sessions(user_id, completed_date DESC);
```

### Emotional Feedback Table
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
CREATE INDEX idx_emotional_feedback_user ON emotional_feedback(user_id, feedback_date DESC);
```

### Liked Sessions Table
```sql
CREATE TABLE liked_sessions (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, session_id)
);
```

### User Progress (Computed/View)
```sql
-- This can be a view or computed on-the-fly
CREATE VIEW user_progress_view AS
SELECT 
  u.id as user_id,
  COUNT(DISTINCT DATE(sd.date)) as streak,
  MAX(sd.date) as last_session_date,
  COUNT(sd.id) as total_sessions
FROM users u
LEFT JOIN session_deltas sd ON u.id = sd.user_id
GROUP BY u.id;
```

## Implementation Steps

### Step 1: Set Up Supabase Project
1. Go to https://supabase.com
2. Create a new project
3. Get your project URL and anon key
4. Install Supabase client: `npm install @supabase/supabase-js`

### Step 2: Create Database Schema
1. Run the SQL schema above in Supabase SQL Editor
2. Set up Row Level Security (RLS) policies
3. Enable email authentication

### Step 3: Create API Service Layer
1. Create service files in `src/services/`
2. Set up Supabase client
3. Create functions for each endpoint

### Step 4: Update Zustand Store
1. Replace mock data with API calls
2. Add loading/error states
3. Implement optimistic updates where appropriate

### Step 5: Update Authentication Flow
1. Replace mock login/register with real API calls
2. Store auth tokens securely (using Expo SecureStore)
3. Add auth state persistence

### Step 6: Add Offline Support (Optional but Recommended)
1. Use React Query or SWR for caching
2. Implement offline-first strategy
3. Sync when online

## Security Considerations

1. **Row Level Security (RLS)**: Enable RLS on all tables so users can only access their own data
2. **API Keys**: Never commit API keys to git, use environment variables
3. **Password Hashing**: Supabase handles this automatically
4. **Input Validation**: Validate all user inputs on backend
5. **Rate Limiting**: Implement rate limiting on auth endpoints

## Next Steps

I can help you implement:
1. ✅ Supabase setup and configuration
2. ✅ Database schema creation
3. ✅ API service layer
4. ✅ Updated Zustand store with API integration
5. ✅ Authentication flow updates

Would you like me to start implementing any of these steps?

