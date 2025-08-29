import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Modal, View, StatusBar } from 'react-native';
import { TodayIcon, ProgressIcon, ExploreIcon, ProfileIcon } from './src/components/icons';

import { TodayScreen } from './src/screens/TodayScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { useStore } from './src/store/useStore';

const Tab = createBottomTabNavigator();

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
      <StatusBar hidden={true} />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              const iconSize = size + 4; // Make icons slightly larger
              if (route.name === 'Today') {
                return <TodayIcon size={iconSize} color={color} focused={focused} />;
              } else if (route.name === 'Progress') {
                return <ProgressIcon size={size + 12} color={color} focused={focused} />;
              } else if (route.name === 'Explore') {
                return <ExploreIcon size={iconSize} color={color} focused={focused} />;
              } else if (route.name === 'Profile') {
                return <ProfileIcon size={iconSize} color={color} focused={focused} />;
              } else {
                return <TodayIcon size={iconSize} color={color} focused={focused} />;
              }
            },
            tabBarActiveTintColor: '#000000',
            tabBarInactiveTintColor: '#666666',
            tabBarIconStyle: {
              marginTop: -3,
            },
            tabBarStyle: {
              backgroundColor: '#ffffff',
              borderTopWidth: 2,
              borderTopColor: '#000000',
              paddingBottom: 15,
              paddingTop: 5,
              height: 80,
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              elevation: 0,
              shadowOpacity: 0,
              zIndex: 1000,
            },
            headerShown: false,
            tabBarShowLabel: true,
          })}
        >
        <Tab.Screen name="Today" component={TodayScreen} />
        <Tab.Screen name="Progress" component={ProgressScreen} />
        <Tab.Screen name="Explore" component={ExploreScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>

      {/* Player Modal */}
      <Modal
        visible={!!activeSession}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <PlayerScreen />
      </Modal>
    </NavigationContainer>
    </>
  );
}
