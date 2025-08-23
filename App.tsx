import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Session } from './src/types';
import { TodayScreen } from './src/screens/TodayScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function App() {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [playerVisible, setPlayerVisible] = useState(false);

  const handleStartSession = (session: Session) => {
    setSelectedSession(session);
    setPlayerVisible(true);
  };

  const handleClosePlayer = () => {
    setPlayerVisible(false);
    setSelectedSession(null);
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'Today') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Explore') {
                iconName = focused ? 'search' : 'search-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              } else {
                iconName = 'help-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#3b82f6',
            tabBarInactiveTintColor: 'gray',
            headerShown: false,
            tabBarStyle: {
              backgroundColor: 'white',
              borderTopWidth: 1,
              borderTopColor: '#e5e7eb',
              paddingBottom: 5,
              paddingTop: 5,
              height: 60,
            },
          })}
        >
          <Tab.Screen 
            name="Today" 
            component={() => <TodayScreen onStartSession={handleStartSession} />}
          />
          <Tab.Screen 
            name="Explore" 
            component={() => <ExploreScreen onStartSession={handleStartSession} />}
          />
          <Tab.Screen 
            name="Profile" 
            component={ProfileScreen}
          />
        </Tab.Navigator>

        <PlayerScreen
          session={selectedSession}
          visible={playerVisible}
          onClose={handleClosePlayer}
        />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
