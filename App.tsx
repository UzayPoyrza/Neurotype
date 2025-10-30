import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, CardStyleInterpolators, StackCardInterpolationProps } from '@react-navigation/stack';
import { Easing } from 'react-native-reanimated';
import { Modal, View, StatusBar, Dimensions } from 'react-native';
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
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { useStore } from './src/store/useStore';

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const activeSession = useStore(state => state.activeSession);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleRegister = () => {
    setIsLoggedIn(true);
  };

  const handleShowRegister = () => {
    setShowRegister(true);
  };

  const handleBackToLogin = () => {
    setShowRegister(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (!isLoggedIn) {
    if (showRegister) {
      return <RegisterScreen onRegister={handleRegister} onBackToLogin={handleBackToLogin} />;
    }
    return <LoginScreen onLogin={handleLogin} onRegister={handleShowRegister} />;
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
