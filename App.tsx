import React, { useState, useEffect } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { Easing } from 'react-native-reanimated';
import { Modal, StatusBar, Platform, Linking as RNLinking, Alert } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as Linking from 'expo-linking';
import { linking } from './src/config/linking';
import { TodayIcon, ProgressIcon, ExploreIcon, ProfileIcon } from './src/components/icons';
import { AnimatedTabBar } from './src/components/AnimatedTabBar';

import { TodayScreen } from './src/screens/TodayScreen';
import { RoadmapScreen } from './src/screens/RoadmapScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { PaymentScreen } from './src/screens/PaymentScreen';
import { SubscriptionScreen } from './src/screens/SubscriptionScreen';
import { MeditationPlayerScreen } from './src/screens/MeditationPlayerScreen';
import { TutorialPlayerScreen } from './src/screens/TutorialPlayerScreen';
import { ModuleDetailScreen } from './src/screens/ModuleDetailScreen';
import { MeditationDetailScreen } from './src/screens/MeditationDetailScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { useStore } from './src/store/useStore';
import { supabase } from './src/services/supabase';
import { getAllSessions, getSessionsByModality, getSessionById } from './src/services/sessionService';
import { ensureTestUser, verifyTestUserConnection } from './src/services/testUserService';
import { getUserPreferences, createUserProfile, getUserProfile, isPremiumUser, getSubscriptionDetails } from './src/services/userService';
import { ensureDailyRecommendations } from './src/services/recommendationService';
import { calculateUserStreak } from './src/services/progressService';
import { getUserEmotionalFeedbackWithSessions } from './src/services/feedbackService';
import { initializeStripe } from './src/services/stripe';
import { scheduleDailyNotification, requestNotificationPermissions } from './src/services/notificationService';
import * as Notifications from 'expo-notifications';
import type { EmotionalFeedbackEntry } from './src/types';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();
const TodayStack = createStackNavigator();
const ExploreStack = createStackNavigator();
const ProfileStack = createStackNavigator();

// Today Stack Navigator
const TodayStackNavigator = () => {
  return (
    <TodayStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        // Use the same optimized iOS-style transition as Settings
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        gestureResponseDistance: 60, // Extra large response area
        gestureVelocityImpact: 0.005, // Minimal velocity needed
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 250,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 80, // Ultra-fast close like Settings
              easing: Easing.out(Easing.cubic),
            },
          },
        },
      }}
    >
      <TodayStack.Screen name="TodayMain" component={TodayScreen} />
      <TodayStack.Screen 
        name="Roadmap" 
        component={RoadmapScreen}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      />
      <TodayStack.Screen 
        name="MeditationDetail" 
        component={MeditationDetailScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 250,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 200,
              },
            },
          },
        }}
      />
    </TodayStack.Navigator>
  );
};

// Explore Stack Navigator
const ExploreStackNavigator = () => {
  return (
    <ExploreStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        // Use optimized iOS-style transition with performance improvements
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        gestureResponseDistance: 20, // Consistent responsive gesture start
        gestureVelocityImpact: 0.15, // Balanced velocity threshold
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 250,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 200,
            },
          },
        },
      }}
    >
      <ExploreStack.Screen name="ExploreMain" component={ExploreScreen} />
      <ExploreStack.Screen 
        name="ModuleDetail" 
        component={ModuleDetailScreen}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          // Maximum responsiveness settings
          gestureResponseDistance: 60, // Extra large response area
          gestureVelocityImpact: 0.005, // Minimal velocity needed
          // Use iOS transition with ultra-fast timing
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 250,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 80, // Ultra-fast close
                easing: Easing.out(Easing.cubic), // Smooth easing for butter smooth release
              },
            },
          },
        }}
      />
      <ExploreStack.Screen 
        name="MeditationDetail" 
        component={MeditationDetailScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 250,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 200,
              },
            },
          },
        }}
      />
    </ExploreStack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        // Use the same optimized iOS-style transition as Explore
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        gestureResponseDistance: 60, // Extra large response area
        gestureVelocityImpact: 0.005, // Minimal velocity needed
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 250,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 80, // Ultra-fast close like modules
              easing: Easing.out(Easing.cubic),
            },
          },
        },
      }}
    >
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      />
      <ProfileStack.Screen 
        name="Subscription" 
        component={SubscriptionScreen}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      />
      <ProfileStack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      />
    </ProfileStack.Navigator>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const activeSession = useStore(state => state.activeSession);
  const hasCompletedOnboarding = useStore(state => state.hasCompletedOnboarding);
  const darkThemeEnabled = useStore(state => state.darkThemeEnabled);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
  const [isThemeReady, setIsThemeReady] = useState(false);

  // Make Android navigation bar transparent
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('transparent');
      NavigationBar.setPositionAsync('absolute');
    }
  }, []);

  // Set up notification handlers
  useEffect(() => {
    // Handle notification received while app is in foreground
    const notificationReceivedListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 [App] Notification received:', notification);
    });

    // Handle notification tapped/opened
    const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 [App] Notification tapped:', response);
      // You can navigate to a specific screen here if needed
      // For example: navigation.navigate('Today');
    });

    return () => {
      notificationReceivedListener.remove();
      notificationResponseListener.remove();
    };
  }, []);

  // Handle deep links
  useEffect(() => {
    const handleDeepLink = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('🔗 [App] App opened from deep link:', initialUrl);
      }
    };
    handleDeepLink();

    const subscription = Linking.addEventListener('url', (event) => {
      console.log('🔗 [App] Deep link received while app running:', event.url);
    });

    return () => subscription.remove();
  }, []);

  // Test Supabase connection and session migration
  useEffect(() => {
    const testSupabaseConnection = async () => {
      try {
        console.log('\n🧪 Testing Supabase connection and session migration...\n');
        
        // Test 1: Fetch all sessions
        console.log('📋 Test 1: Fetching all sessions...');
        const allSessions = await getAllSessions();
        console.log(`✅ Found ${allSessions.length} sessions`);
        
        if (allSessions.length > 0) {
          console.log('📝 Sessions:');
          allSessions.slice(0, 5).forEach(s => {
            console.log(`   - ${s.title} (${s.durationMin}min, ${s.modality})`);
          });
          if (allSessions.length > 5) {
            console.log(`   ... and ${allSessions.length - 5} more`);
          }
        } else {
          console.log('⚠️ No sessions found - database might be empty');
        }
        
        // Test 2: Fetch sessions by modality (anxiety)
        console.log('\n📋 Test 2: Fetching anxiety sessions...');
        const anxietySessions = await getSessionsByModality('anxiety');
        console.log(`✅ Found ${anxietySessions.length} anxiety sessions`);
        if (anxietySessions.length > 0) {
          console.log('📝 Anxiety sessions:', anxietySessions.map(s => s.title).join(', '));
        }
        
        // Test 3: Fetch sessions by modality (stress) - should have cross-module sessions
        console.log('\n📋 Test 3: Fetching stress sessions (testing cross-module)...');
        const stressSessions = await getSessionsByModality('stress');
        console.log(`✅ Found ${stressSessions.length} stress sessions`);
        if (stressSessions.length > 0) {
          console.log('📝 Stress sessions:', stressSessions.map(s => s.title).join(', '));
        }
        
        // Test 4: Check for cross-module session (Ocean Waves should be in both)
        console.log('\n📋 Test 4: Verifying cross-module sessions...');
        const oceanWaves = anxietySessions.find(s => s.title.includes('Ocean Waves'));
        if (oceanWaves) {
          const alsoInStress = stressSessions.find(s => s.id === oceanWaves.id);
          if (alsoInStress) {
            console.log(`✅ Cross-module verified: "${oceanWaves.title}" appears in both anxiety and stress`);
          } else {
            console.log(`⚠️ Cross-module check: "${oceanWaves.title}" not found in stress sessions`);
          }
        }
        
        // Test 5: Fetch single session by ID
        if (allSessions.length > 0) {
          console.log('\n📋 Test 5: Fetching single session by ID...');
          const firstSession = await getSessionById(allSessions[0].id);
          if (firstSession) {
            console.log(`✅ Retrieved session: "${firstSession.title}"`);
          } else {
            console.log('⚠️ Could not retrieve session by ID');
          }
        }
        
        console.log('\n✅ All tests completed successfully!\n');
        
      } catch (error) {
        console.error('❌ Connection test failed:', error);
      }
    };

    // Run test after a short delay to ensure app is initialized
    const timer = setTimeout(() => {
      testSupabaseConnection();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Test Stripe connection
  useEffect(() => {
    const testStripeConnection = async () => {
      try {
        console.log('\n💳 Testing Stripe connection...\n');
        
        const result = await initializeStripe();
        
        if (result.success) {
          console.log('✅ Stripe connection successful!');
          console.log('✅ Stripe SDK is ready to use');
        } else {
          console.error('❌ Stripe connection failed:', result.error);
          Alert.alert(
            'Stripe Configuration Error',
            `Stripe initialization failed: ${result.error}\n\nPlease check your EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env file.`,
            [{ text: 'OK' }]
          );
        }
      } catch (error: any) {
        console.error('❌ Error testing Stripe connection:', error);
        Alert.alert(
          'Stripe Error',
          `Failed to test Stripe connection: ${error.message || 'Unknown error'}`,
          [{ text: 'OK' }]
        );
      }
    };

    // Run test after Supabase test
    const timer = setTimeout(() => {
      testStripeConnection();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Function to load user data when session is restored or user signs in
  const loadUserData = async (userId: string) => {
    // Add timeout wrapper to prevent infinite loading
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Loading user data timed out after 30 seconds. Please check your internet connection.'));
      }, 30000); // 30 second timeout
    });
    
    const loadDataPromise = (async () => {
      try {
        console.log('📱 [App] Loading user data for userId:', userId);
      
      // Validate Supabase connection first
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ [App] Supabase credentials missing!');
        console.error('❌ [App] EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
        console.error('❌ [App] EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
        Alert.alert(
          'Configuration Error',
          'Supabase credentials are not configured.\n\nPlease check your .env file.\n\nURL: ' + (supabaseUrl ? 'Set' : 'Missing') + '\nKey: ' + (supabaseAnonKey ? 'Set' : 'Missing'),
          [{ text: 'OK' }]
        );
        throw new Error('Supabase credentials not configured');
      }
      
      // Test connection by getting session
      console.log('🔌 [App] Testing Supabase connection...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ [App] Failed to get session:', sessionError);
        console.error('❌ [App] Session error code:', sessionError.code);
        console.error('❌ [App] Session error message:', sessionError.message);
        Alert.alert(
          'Connection Error',
          `Failed to connect to Supabase.\n\nError: ${sessionError.message}\nCode: ${sessionError.code || 'N/A'}\n\nPlease check your internet connection and try again.`,
          [{ text: 'OK' }]
        );
        throw new Error(`Connection error: ${sessionError.message}`);
      }
      console.log('✅ [App] Supabase connection verified, session exists:', !!session);
      
      // Load user profile and subscription type from database
      console.log('📱 [App] Loading user profile...');
      try {
        const userProfile = await getUserProfile(userId);
        
        if (userProfile) {
          console.log('✅ [App] Loaded user profile:', userProfile);
          // Validate premium status and update store
          const isPremium = await isPremiumUser(userId);
          const subscriptionType = isPremium ? 'premium' : 'basic';
          const currentSubscriptionType = useStore.getState().subscriptionType;
          if (subscriptionType !== currentSubscriptionType) {
            useStore.getState().setSubscriptionType(subscriptionType);
            console.log('📱 [App] Updated subscription type to:', subscriptionType, '(validated)');
          }
          
          // Fetch subscription details if premium
          if (subscriptionType === 'premium') {
            const details = await getSubscriptionDetails(userId);
            if (details) {
              useStore.getState().setSubscriptionCancelAt(details.cancelAt);
              useStore.getState().setSubscriptionEndDate(details.endDate);
              useStore.getState().setSubscriptionIsLifetime(details.isLifetime);
              console.log('📱 [App] Subscription details loaded:', { cancelAt: details.cancelAt, endDate: details.endDate, isLifetime: details.isLifetime });
            }
          } else {
            useStore.getState().setSubscriptionCancelAt(null);
            useStore.getState().setSubscriptionEndDate(null);
            useStore.getState().setSubscriptionIsLifetime(false);
          }
          // Update store with first name from database
          if (userProfile.first_name) {
            useStore.getState().setUserFirstName(userProfile.first_name);
            console.log('📱 [App] Updated user first name to:', userProfile.first_name);
          }
        } else {
          console.log('⚠️ [App] No user profile found, using defaults');
        }
      } catch (profileError: any) {
        console.error('❌ [App] Error loading user profile:', profileError);
        console.error('❌ [App] Profile error details:', {
          message: profileError.message,
          code: profileError.code,
          stack: profileError.stack,
        });
        // Continue with defaults - profile loading failure is not critical
      }
      
      // Load user preferences from database
      console.log('📱 [App] Loading user preferences...');
      try {
        const preferences = await getUserPreferences(userId);
        
        if (preferences) {
          console.log('✅ [App] Loaded preferences:', preferences);
          // Update store with preferences from database
          const currentReminderEnabled = useStore.getState().reminderEnabled;
          if (preferences.reminder_enabled !== currentReminderEnabled) {
            // Only update if different to avoid unnecessary state changes
            if (preferences.reminder_enabled && !currentReminderEnabled) {
              useStore.getState().toggleReminder(); // Toggle from false to true
            } else if (!preferences.reminder_enabled && currentReminderEnabled) {
              useStore.getState().toggleReminder(); // Toggle from true to false
            }
            console.log('📱 [App] Updated reminder preference to:', preferences.reminder_enabled);
          }

          // Update dark theme preference from database
          if (preferences.dark_theme_enabled != null) {
            useStore.getState().setDarkThemeEnabled(preferences.dark_theme_enabled);
          }

          // Restore scheduled notifications if reminder is enabled
          if (preferences.reminder_enabled) {
            console.log('📱 [App] Restoring scheduled notifications...');
            const hasPermission = await requestNotificationPermissions();
            if (hasPermission) {
              // Use saved reminder time if available, otherwise default to 7:00 PM
              let notificationTime = { hour: 19, minute: 0 };
              if (preferences.reminder_time) {
                const [hour, minute] = preferences.reminder_time.split(':').map(Number);
                if (!isNaN(hour) && !isNaN(minute)) {
                  notificationTime = { hour, minute };
                  console.log(`📱 [App] Using saved reminder time: ${hour}:${minute.toString().padStart(2, '0')}`);
                }
              }
              await scheduleDailyNotification(notificationTime);
              console.log('✅ [App] Daily notifications restored');
            } else {
              console.warn('⚠️ [App] Cannot restore notifications - permissions not granted');
            }
          }
        } else {
          console.log('⚠️ [App] No preferences found, using defaults');
        }
      } catch (prefError: any) {
        console.error('❌ [App] Error loading preferences:', prefError);
        console.error('❌ [App] Preferences error details:', {
          message: prefError.message,
          code: prefError.code,
          stack: prefError.stack,
        });
        Alert.alert(
          'Warning',
          `Failed to load user preferences.\n\nError: ${prefError.message || 'Unknown error'}\n\nUsing default settings.`,
          [{ text: 'OK' }]
        );
        // Continue with defaults - preferences are not critical
      }
      
      // Sync today's completed sessions from database (clear cache and reload)
      console.log('🔄 [App] Syncing today\'s completed sessions from database...');
      try {
        await useStore.getState().syncTodayCompletedSessionsFromDatabase(userId);
        console.log('✅ [App] Completed sessions synced');
      } catch (syncError: any) {
        console.error('❌ [App] Error syncing completed sessions:', syncError);
        console.error('❌ [App] Sync error details:', {
          message: syncError.message,
          code: syncError.code,
        });
        Alert.alert(
          'Warning',
          `Failed to sync completed sessions.\n\nError: ${syncError.message || 'Unknown error'}\nCode: ${syncError.code || 'N/A'}`,
          [{ text: 'OK' }]
        );
        // Continue - sync failure is not critical
      }
      
      // Clear sessions, calendar, and emotional feedback caches on app open
      console.log('🧹 [App] Clearing sessions, calendar, and emotional feedback caches on app open...');
      useStore.getState().clearSessionsCache();
      useStore.getState().clearCalendarCache();
      useStore.getState().clearEmotionalFeedbackCache();

      // Sync all historical completed sessions for Progress screen
      console.log('📊 [App] Syncing all completed sessions from database...');
      try {
        await useStore.getState().syncAllCompletedSessionsFromDatabase(userId);
        console.log('✅ [App] All completed sessions synced');
      } catch (syncError: any) {
        console.error('❌ [App] Error syncing all completed sessions:', syncError);
        // Continue - sync failure is not critical
      }

      // Sync liked sessions from database
      console.log('💙 [App] Syncing liked sessions from database...');
      try {
        await useStore.getState().syncLikedSessionsFromDatabase(userId);
        console.log('✅ [App] Liked sessions synced');
      } catch (syncError: any) {
        console.error('❌ [App] Error syncing liked sessions:', syncError);
        // Continue - sync failure is not critical
      }

      // Calculate and update streak from completed sessions
      console.log('🔥 [App] Calculating streak from completed sessions...');
      try {
        const streak = await calculateUserStreak(userId);
        useStore.setState((state) => ({
          userProgress: {
            ...state.userProgress,
            streak: streak,
          },
        }));
        console.log(`✅ [App] Streak calculated and updated: ${streak} days`);
      } catch (streakError: any) {
        console.error('❌ [App] Error calculating streak:', streakError);
        console.error('❌ [App] Streak error details:', {
          message: streakError.message,
          code: streakError.code,
        });
        Alert.alert(
          'Warning',
          `Failed to calculate streak.\n\nError: ${streakError.message || 'Unknown error'}\nCode: ${streakError.code || 'N/A'}`,
          [{ text: 'OK' }]
        );
        // Continue - streak calculation failure is not critical
      }
      
      // Load emotional feedback history from database (with sessions in single query)
      console.log('💭 [App] Loading emotional feedback history from database...');
      try {
        const feedbackWithSessions = await getUserEmotionalFeedbackWithSessions(userId, 20);
        console.log('💭 [App] Fetched', feedbackWithSessions.length, 'emotional feedback entries with sessions');
        
        // Transform to EmotionalFeedbackEntry format and filter out entries without sessions
        const emotionalFeedbackEntries: EmotionalFeedbackEntry[] = feedbackWithSessions
          .filter(({ session }) => session !== null)
          .map(({ feedback }) => ({
            id: feedback.id || `feedback-${feedback.feedback_date}-${feedback.session_id}`,
            sessionId: feedback.session_id,
            label: feedback.label,
            timestampSeconds: feedback.timestamp_seconds,
            date: feedback.feedback_date,
          }));
        
        // Cache session details for feedback entries
        // Only cache if session doesn't already exist in cache (to avoid overwriting complete sessions)
        const feedbackSessions = feedbackWithSessions
          .filter(({ session }) => session !== null)
          .map(({ session, feedback }) => ({
            id: session!.id,
            title: session!.title,
            durationMin: session!.duration_min,
            modality: session!.modality as any, // Already mapped from technique
            goal: session!.goal as any, // Default 'anxiety'
          }))
          .filter((session) => {
            // Only cache if session doesn't already exist in cache
            // This prevents overwriting complete sessions with incomplete ones
            const existing = useStore.getState().getCachedSession(session.id);
            return !existing; // Only cache if it doesn't exist
          });
        
        if (feedbackSessions.length > 0) {
          useStore.getState().cacheSessions(feedbackSessions);
        }
        
        // Set emotional feedback cache
        useStore.getState().setEmotionalFeedbackCache(emotionalFeedbackEntries);
        console.log('✅ [App] Emotional feedback history loaded and cached:', emotionalFeedbackEntries.length, 'entries');
      } catch (feedbackError: any) {
        console.error('❌ [App] Error loading emotional feedback history:', feedbackError);
        console.error('❌ [App] Feedback error details:', {
          message: feedbackError.message,
          code: feedbackError.code,
        });
        // Continue - feedback loading failure is not critical
      }
      
      // Ensure daily recommendations exist for today (default module: anxiety)
      console.log('🎯 [App] Checking daily recommendations...');
      try {
        const defaultModuleId = 'anxiety'; // Default module
        const recResult = await ensureDailyRecommendations(userId, defaultModuleId);
        
        if (recResult.success) {
          if (recResult.generated) {
            console.log('✅ [App] Generated new daily recommendations');
          } else {
            console.log('✅ [App] Daily recommendations already exist for today');
          }
        } else {
          console.error('❌ [App] Failed to ensure daily recommendations:', recResult.error);
          console.error('❌ [App] Recommendation error details:', recResult.error);
          Alert.alert(
            'Warning',
            `Failed to ensure recommendations.\n\nError: ${recResult.error || 'Unknown error'}\n\nRecommendations may not be available.`,
            [{ text: 'OK' }]
          );
        }
      } catch (recError: any) {
        console.error('❌ [App] Error ensuring recommendations:', recError);
        console.error('❌ [App] Recommendation error details:', {
          message: recError.message,
          code: recError.code,
        });
        Alert.alert(
          'Warning',
          `Failed to load recommendations.\n\nError: ${recError.message || 'Unknown error'}\nCode: ${recError.code || 'N/A'}\n\nRecommendations will be generated when available.`,
          [{ text: 'OK' }]
        );
        // Continue - recommendations can be generated later
      }
      
      console.log('✅ [App] User data loaded successfully');
      } catch (loadError: any) {
        console.error('❌ [App] Failed to load user data:', loadError);
        console.error('❌ [App] Error type:', typeof loadError);
        console.error('❌ [App] Error message:', loadError?.message);
        console.error('❌ [App] Error code:', loadError?.code);
        console.error('❌ [App] Error stack:', loadError?.stack);
        
        // Check if it's a network error
        if (loadError?.message?.includes('Network') || loadError?.message?.includes('fetch') || loadError?.code === 'NETWORK_ERROR') {
          console.error('❌ [App] Network error detected - check internet connection');
          Alert.alert(
            'Network Error',
            'Unable to connect to the server.\n\nPlease check your internet connection and try again.\n\nError: ' + (loadError?.message || 'Unknown network error'),
            [{ text: 'OK' }]
          );
        } else if (loadError?.message?.includes('Supabase') || loadError?.message?.includes('credentials')) {
          // Check if it's a Supabase configuration error
          console.error('❌ [App] Supabase configuration error - check environment variables');
          Alert.alert(
            'Configuration Error',
            'Supabase is not properly configured.\n\nPlease check your environment variables.\n\nError: ' + (loadError?.message || 'Unknown configuration error'),
            [{ text: 'OK' }]
          );
        } else {
          // Generic error
          Alert.alert(
            'Error Loading Data',
            `Failed to load user data.\n\nError: ${loadError?.message || 'Unknown error'}\nCode: ${loadError?.code || 'N/A'}\n\nPlease try again or contact support if the issue persists.`,
            [{ text: 'OK' }]
          );
        }
        throw loadError; // Re-throw to be caught by timeout wrapper
      }
    })();
    
    // Race between timeout and actual loading
    try {
      await Promise.race([loadDataPromise, timeoutPromise]);
    } catch (error: any) {
      // This catches both timeout and load errors
      if (error?.message?.includes('timed out')) {
        console.error('❌ [App] User data loading timed out after 30 seconds');
        // Don't show alert - let TodayScreen handle its own timeout alerts with retry
        // Just log the error and continue
      }
      // Other errors were already handled and shown in loadDataPromise
    }
  };

  // Auth state listener - handles Google OAuth redirect and Apple sign-in
  useEffect(() => {
    // Validate Supabase connection first
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ [App] Supabase credentials missing - cannot restore session');
      Alert.alert(
        'Configuration Error',
        'Supabase credentials are not configured.\n\nURL: ' + (supabaseUrl ? 'Set' : 'Missing') + '\nKey: ' + (supabaseAnonKey ? 'Set' : 'Missing') + '\n\nPlease check your .env file.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Check initial session - if user is already logged in, skip onboarding and load data
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('❌ [App] Error getting initial session:', error);
        console.error('❌ [App] Session error code:', error.code);
        console.error('❌ [App] Session error message:', error.message);
        Alert.alert(
          'Session Error',
          `Failed to check for existing session.\n\nError: ${error.message}\nCode: ${error.code || 'N/A'}\n\nPlease check your internet connection.`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      if (session?.user) {
        const userId = session.user.id;
        console.log('✅ [App] Found existing session for user:', userId);

        // Load theme preference FIRST to avoid flash of wrong theme
        try {
          const prefs = await getUserPreferences(userId);
          if (prefs && prefs.dark_theme_enabled != null) {
            useStore.getState().setDarkThemeEnabled(prefs.dark_theme_enabled);
            console.log('🎨 [App] Applied saved theme preference:', prefs.dark_theme_enabled ? 'dark' : 'light');
          }
        } catch (themeError) {
          console.warn('⚠️ [App] Could not load theme preference, using system default');
        }

        // IMPORTANT: Check if user profile exists before assuming onboarding is complete
        // New users who just signed in may have a session but no profile yet
        try {
          const userProfile = await getUserProfile(userId);
          
          if (userProfile) {
            // User profile exists - they've completed onboarding before
            console.log('✅ [App] User profile exists, user has completed onboarding');
            
            // Validate premium status and update store
            const isPremium = await isPremiumUser(userId);
            const subscriptionType = isPremium ? 'premium' : 'basic';
            useStore.getState().setSubscriptionType(subscriptionType);
            console.log('✅ [App] Updated subscription type from database after session restore:', subscriptionType, '(validated)');
            
            // Fetch subscription details if premium
            if (subscriptionType === 'premium') {
              const details = await getSubscriptionDetails(userId);
              if (details) {
                useStore.getState().setSubscriptionCancelAt(details.cancelAt);
                useStore.getState().setSubscriptionEndDate(details.endDate);
                useStore.getState().setSubscriptionIsLifetime(details.isLifetime);
              }
            } else {
              useStore.getState().setSubscriptionCancelAt(null);
              useStore.getState().setSubscriptionEndDate(null);
              useStore.getState().setSubscriptionIsLifetime(false);
            }
            
            setIsThemeReady(true);
            useStore.setState({
              userId,
              isLoggedIn: true,
              hasCompletedOnboarding: true
            });

            // Load user data when session is restored (don't await - let it run in background)
            loadUserData(userId).catch((loadError) => {
              console.error('❌ [App] Failed to load user data after session restore:', loadError);
              // Error is already shown in loadUserData, but ensure userId is still set
              if (!useStore.getState().userId) {
                useStore.setState({ userId });
              }
            });
          } else {
            // User profile doesn't exist - this is a new user who just signed in
            // They need to complete onboarding first
            console.log('⚠️ [App] User profile not found - user needs to complete onboarding');
            useStore.setState({ 
              userId, 
              isLoggedIn: true,
              hasCompletedOnboarding: false // Don't skip onboarding
            });
            
            // Try to create user profile now (in case it failed during sign-in)
            try {
              const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
              const firstName = fullName?.trim() ? fullName.trim().split(' ')[0] : undefined;
              
              const result = await createUserProfile(
                userId,
                session.user.email || '',
                firstName
              );
              
              if (result.success) {
                console.log('✅ [App] User profile created successfully');
                
                // Validate premium status and update store after profile creation
                try {
                  const isPremium = await isPremiumUser(userId);
                  const subscriptionType = isPremium ? 'premium' : 'basic';
                  useStore.getState().setSubscriptionType(subscriptionType);
                  console.log('✅ [App] Updated subscription type from database:', subscriptionType, '(validated)');
                  
                  // Fetch subscription details if premium
                  if (subscriptionType === 'premium') {
                    const details = await getSubscriptionDetails(userId);
                    if (details) {
                      useStore.getState().setSubscriptionCancelAt(details.cancelAt);
                    }
                  } else {
                    useStore.getState().setSubscriptionCancelAt(null);
                  }
                } catch (subscriptionError) {
                  console.error('❌ [App] Error checking subscription type:', subscriptionError);
                }
              } else {
                console.error('❌ [App] Failed to create user profile:', result.error);
              }
            } catch (profileError) {
              console.error('❌ [App] Error creating user profile:', profileError);
            }
          }
        } catch (profileCheckError) {
          console.error('❌ [App] Error checking user profile:', profileCheckError);
          // If we can't check the profile, assume user needs onboarding to be safe
          useStore.setState({ 
            userId, 
            isLoggedIn: true,
            hasCompletedOnboarding: false
          });
        }
      } else {
        console.log('ℹ️ [App] No existing session found');
      }
    }).catch((error) => {
      console.error('❌ [App] Exception getting initial session:', error);
      console.error('❌ [App] Exception type:', typeof error);
      console.error('❌ [App] Exception message:', error?.message);
      console.error('❌ [App] Exception stack:', error?.stack);
      Alert.alert(
        'Session Error',
        `Failed to check for existing session.\n\nError: ${error?.message || 'Unknown error'}\n\nPlease try restarting the app.`,
        [{ text: 'OK' }]
      );
    });

    // Listen for auth state changes (handles Google OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            const userId = session.user.id;
            const currentHasCompletedOnboarding = useStore.getState().hasCompletedOnboarding;
            
            // Only set hasCompletedOnboarding if user is not currently in onboarding
            // If they're in onboarding, let them complete it first
            useStore.setState({ 
              userId, 
              isLoggedIn: true,
              // Don't set hasCompletedOnboarding here - let onboarding screen handle it
              // Only set it if user already completed onboarding (session restore case)
              hasCompletedOnboarding: currentHasCompletedOnboarding
            });
            
            // Create profile if needed
            // Skip profile creation if user is in onboarding - OnboardingScreen will handle it
            const isInOnboarding = !useStore.getState().hasCompletedOnboarding;
            if (isInOnboarding) {
              console.log('🔵 [App] User is in onboarding, skipping profile creation (OnboardingScreen will handle it)');
            } else {
              try {
                console.log('🔵 [App] Checking/creating user profile in auth state change handler...');
                // Extract first name consistently (split full name to get first name only)
                // Handle cases where Apple Sign-In doesn't provide names (trim to handle whitespace-only strings)
                const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
                const firstName = fullName?.trim() ? fullName.trim().split(' ')[0] : undefined;
                
                console.log('🔵 [App] Profile creation params:', {
                  userId,
                  email: session.user.email || '',
                  firstName,
                  fullName,
                });
                
                const result = await createUserProfile(
                  userId,
                  session.user.email || '',
                  firstName
                );
                
                if (result.success) {
                  console.log('✅ [App] User profile created successfully in auth state change handler');
                  
                  // Validate premium status and update store after profile creation
                  try {
                    const isPremium = await isPremiumUser(userId);
                    const subscriptionType = isPremium ? 'premium' : 'basic';
                    useStore.getState().setSubscriptionType(subscriptionType);
                    console.log('✅ [App] Updated subscription type from database after login:', subscriptionType, '(validated)');
                    
                    // Fetch subscription details if premium
                    if (subscriptionType === 'premium') {
                      const details = await getSubscriptionDetails(userId);
                      if (details) {
                        useStore.getState().setSubscriptionCancelAt(details.cancelAt);
                      }
                    } else {
                      useStore.getState().setSubscriptionCancelAt(null);
                    }
                  } catch (subscriptionError) {
                    console.error('❌ [App] Error checking subscription type after login:', subscriptionError);
                  }
                } else {
                  console.error('❌ [App] Failed to create user profile:', result.error);
                  // Don't show alert here as it might interrupt the user flow
                  // Profile creation failure is non-critical
                }
              } catch (error: any) {
                console.error('❌ [App] Error creating user profile:', error);
                console.error('❌ [App] Error details:', {
                  message: error?.message,
                  code: error?.code,
                  stack: error?.stack,
                });
                // Profile creation failure is non-critical, don't interrupt user
              }
            }
            
            // Only load user data if onboarding is already completed
            // Otherwise, wait for onboarding to finish
            if (currentHasCompletedOnboarding) {
              await loadUserData(userId);
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('✅ [App] User signed out event received');
            useStore.setState({ 
              userId: null, 
              isLoggedIn: false,
              hasCompletedOnboarding: false // Reset onboarding on logout
            });
          } else if (event === 'TOKEN_REFRESHED') {
            // Token refreshed successfully
            if (!session) {
              console.error('Token refresh failed - no session');
            }
          } else if (event === 'USER_UPDATED') {
            // User updated successfully
          } else if (event === 'SIGNED_IN' && !session?.user) {
            // Signed in event but no user - this is an error
            console.error('SIGNED_IN event but no user in session');
          }
        } catch (error) {
          console.error('Error in auth state change handler:', error);
          // Don't show alert here as it's a global handler - let individual screens handle their own errors
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const handleOnboardingFinish = async (skipped?: boolean) => {
    const userId = useStore.getState().userId;

    // Load theme preference BEFORE showing main app to avoid flash
    if (userId && !skipped) {
      try {
        const prefs = await getUserPreferences(userId);
        if (prefs && prefs.dark_theme_enabled != null) {
          useStore.getState().setDarkThemeEnabled(prefs.dark_theme_enabled);
          console.log('🎨 [App] Applied theme preference before showing main app:', prefs.dark_theme_enabled ? 'dark' : 'light');
        }
      } catch (themeError) {
        console.warn('⚠️ [App] Could not load theme preference, using system default');
      }
    }

    setIsThemeReady(true);
    useStore.setState({
      hasCompletedOnboarding: true,
      isLoggedIn: true
    });

    // If user signed in (has userId), load their data
    if (userId && !skipped) {
      console.log('📱 [App] User finished onboarding after sign-in, loading user data...');
      loadUserData(userId).catch((error) => {
        console.error('❌ [App] Failed to load user data after onboarding:', error);
      });
    }
    
    // Only initialize test user if skip was pressed
    if (skipped) {
      const initTestUser = async () => {
        try {
          const testUserId = await ensureTestUser();
          useStore.setState({ userId: testUserId });
          console.log('👤 Test user connected to app:', testUserId);
          console.log('✅ You are now logged in as user:', testUserId);
          
          // Load user preferences from database
          console.log('📱 [App] Loading user preferences...');
          const preferences = await getUserPreferences(testUserId);
          
          if (preferences) {
            console.log('📱 [App] Loaded preferences:', preferences);
            // Update store with preferences from database
            const currentReminderEnabled = useStore.getState().reminderEnabled;
            if (preferences.reminder_enabled !== currentReminderEnabled) {
              // Only update if different to avoid unnecessary state changes
              if (preferences.reminder_enabled && !currentReminderEnabled) {
                useStore.getState().toggleReminder(); // Toggle from false to true
              } else if (!preferences.reminder_enabled && currentReminderEnabled) {
                useStore.getState().toggleReminder(); // Toggle from true to false
              }
              console.log('📱 [App] Updated reminder preference to:', preferences.reminder_enabled);
            }

            // Update dark theme preference from database
            if (preferences.dark_theme_enabled != null) {
              useStore.getState().setDarkThemeEnabled(preferences.dark_theme_enabled);
            }

            // Restore scheduled notifications if reminder is enabled
            if (preferences.reminder_enabled) {
              console.log('📱 [App] Restoring scheduled notifications...');
              const hasPermission = await requestNotificationPermissions();
              if (hasPermission) {
                // Use saved reminder time if available, otherwise default to 7:00 PM
                let notificationTime = { hour: 19, minute: 0 };
                if (preferences.reminder_time) {
                  const [hour, minute] = preferences.reminder_time.split(':').map(Number);
                  if (!isNaN(hour) && !isNaN(minute)) {
                    notificationTime = { hour, minute };
                    console.log(`📱 [App] Using saved reminder time: ${hour}:${minute.toString().padStart(2, '0')}`);
                  }
                }
                await scheduleDailyNotification(notificationTime);
                console.log('✅ [App] Daily notifications restored');
              } else {
                console.warn('⚠️ [App] Cannot restore notifications - permissions not granted');
              }
            }
          } else {
            console.log('📱 [App] No preferences found, using defaults');
          }
          
          // Sync today's completed sessions from database (clear cache and reload)
          console.log('🔄 [App] Syncing today\'s completed sessions from database...');
          await useStore.getState().syncTodayCompletedSessionsFromDatabase(testUserId);
          
          // Clear sessions and calendar caches on app open
          console.log('🧹 [App] Clearing sessions and calendar caches on app open...');
          useStore.getState().clearSessionsCache();
          useStore.getState().clearCalendarCache();
          
          // Calculate and update streak from completed sessions
          console.log('🔥 [App] Calculating streak from completed sessions...');
          const streak = await calculateUserStreak(testUserId);
          useStore.setState((state) => ({
            userProgress: {
              ...state.userProgress,
              streak: streak,
            },
          }));
          console.log(`✅ [App] Streak calculated and updated: ${streak} days`);
          
          // Ensure daily recommendations exist for today (default module: anxiety)
          console.log('🎯 [App] Checking daily recommendations...');
          const defaultModuleId = 'anxiety'; // Default module
          const recResult = await ensureDailyRecommendations(testUserId, defaultModuleId);
          
          if (recResult.success) {
            if (recResult.generated) {
              console.log('✅ [App] Generated new daily recommendations');
            } else {
              console.log('✅ [App] Daily recommendations already exist for today');
            }
          } else {
            console.error('❌ [App] Failed to ensure daily recommendations:', recResult.error);
          }
        } catch (error) {
          console.error('❌ Failed to initialize test user:', error);
          // Set test user ID anyway as fallback
          useStore.setState({ userId: '00000000-0000-0000-0000-000000000001' });
        }
      };
      
      initTestUser();
    }
  };

  if (showSplash) {
    return (
      <ThemeProvider>
        <SplashScreen onFinish={handleSplashFinish} />
      </ThemeProvider>
    );
  }

  if (!hasCompletedOnboarding) {
    return (
      <SafeAreaProvider>
        <ThemeProvider>
          <OnboardingScreen onFinish={handleOnboardingFinish} />
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  // Wait for theme preference to load before showing main app to avoid theme flash
  if (!isThemeReady) {
    return (
      <ThemeProvider>
        <SplashScreen onFinish={() => {}} />
      </ThemeProvider>
    );
  }

  const navTheme = darkThemeEnabled
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: '#0A0A0F',
          card: '#0A0A0F',
          border: 'rgba(255,255,255,0.06)',
          primary: '#0A84FF',
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: '#f2f1f6',
          card: '#ffffff',
          border: 'rgba(0,0,0,0.04)',
          primary: '#007AFF',
        },
      };

  return (
    <ThemeProvider>
      <StatusBar
        barStyle={darkThemeEnabled ? 'light-content' : 'dark-content'}
        backgroundColor={darkThemeEnabled ? '#0A0A0F' : '#f2f1f6'}
        translucent={false}
      />
      <NavigationContainer linking={linking} theme={navTheme}>
        <Tab.Navigator
          tabBar={props => <AnimatedTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
          }}
        >
        <Tab.Screen name="Today" component={TodayStackNavigator} />
        <Tab.Screen name="Progress" component={ProgressScreen} />
        <Tab.Screen name="Explore" component={ExploreStackNavigator} />
        <Tab.Screen name="Profile" component={ProfileStackNavigator} />
      </Tab.Navigator>

      {/* Player Modal */}
      <Modal
        visible={!!activeSession}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {(activeSession as any)?.isTutorial ? (
          <TutorialPlayerScreen />
        ) : (
          <MeditationPlayerScreen />
        )}
      </Modal>
    </NavigationContainer>
    </ThemeProvider>
  );
}
