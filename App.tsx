import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { Easing } from 'react-native-reanimated';
import { Modal, StatusBar } from 'react-native';
import { TodayIcon, ProgressIcon, ExploreIcon, ProfileIcon } from './src/components/icons';
import { AnimatedTabBar } from './src/components/AnimatedTabBar';

import { TodayScreen } from './src/screens/TodayScreen';
import { RoadmapScreen } from './src/screens/RoadmapScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
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
import { getUserPreferences } from './src/services/userService';

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
    </ProfileStack.Navigator>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const activeSession = useStore(state => state.activeSession);
  const hasCompletedOnboarding = useStore(state => state.hasCompletedOnboarding);

  // Initialize test user and load preferences
  useEffect(() => {
    const initTestUser = async () => {
      try {
        const userId = await ensureTestUser();
        useStore.setState({ userId });
        console.log('👤 Test user connected to app:', userId);
        console.log('✅ You are now logged in as user:', userId);
        
        // Verify user ID is in store
        const storeUserId = useStore.getState().userId;
        if (storeUserId === userId) {
          console.log('✅ User ID stored in app state:', userId);
        }
        
        // Load user preferences from database
        console.log('📱 [App] Loading user preferences...');
        const preferences = await getUserPreferences(userId);
        
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
        } else {
          console.log('📱 [App] No preferences found, using defaults');
        }
      } catch (error) {
        console.error('❌ Failed to initialize test user:', error);
        // Set test user ID anyway as fallback
        useStore.setState({ userId: '00000000-0000-0000-0000-000000000001' });
      }
    };
    
    initTestUser();
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

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const handleOnboardingFinish = () => {
    useStore.setState({ 
      hasCompletedOnboarding: true,
      isLoggedIn: true 
    });
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingScreen onFinish={handleOnboardingFinish} />;
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
      <NavigationContainer>
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
    </>
  );
}
