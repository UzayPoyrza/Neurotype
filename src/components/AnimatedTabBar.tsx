import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TodayIcon, ProgressIcon, ExploreIcon, ProfileIcon } from './icons';

export const AnimatedTabBar: React.FC<BottomTabBarProps> = ({ 
  state, 
  descriptors, 
  navigation 
}) => {
  const scaleAnimations = useRef<Animated.Value[]>(
    state.routes.map(() => new Animated.Value(1))
  ).current;

  const handleTabPress = (route: any, index: number) => {
    console.log('Tab pressed:', route.name, 'index:', index); // Debug log

    // Squeeze animation
    const scaleAnimation = scaleAnimations[index];
    console.log('Starting animation for index:', index); // Debug log
    
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.7, // More dramatic scale down
        duration: 80, // Faster animation
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 80, // Faster animation
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log('Animation completed for index:', index); // Debug log
    });

    // Navigate to the route
    navigation.navigate(route.name);
  };

  const getIcon = (routeName: string, focused: boolean, color: string, size: number) => {
    const iconSize = size + 4; // Make icons slightly larger
    
    switch (routeName) {
      case 'Today':
        return <TodayIcon size={iconSize} color={color} focused={focused} />;
      case 'Progress':
        return <ProgressIcon size={iconSize} color={color} focused={focused} />;
      case 'Explore':
        return <ExploreIcon size={iconSize} color={color} focused={focused} />;
      case 'Profile':
        return <ProfileIcon size={iconSize} color={color} focused={focused} />;
      default:
        return <TodayIcon size={iconSize} color={color} focused={focused} />;
    }
  };

  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const color = isFocused ? '#007AFF' : '#8e8e93';
        const size = 24;

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={() => handleTabPress(route, index)}
            activeOpacity={0.7}
          >
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: scaleAnimations[index] }],
                },
              ]}
            >
              {getIcon(route.name, isFocused, color, size)}
            </Animated.View>
            <Text style={[
              styles.label,
              isFocused ? styles.focusedLabel : styles.unfocusedLabel,
            ]}>
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f7', // iOS system background to match screens
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0', // Subtle border
    paddingBottom: 20, // Increased for better spacing
    paddingTop: 8,
    height: 85, // Slightly taller for better proportions
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
    shadowOpacity: 0,
    zIndex: 1000,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  focusedLabel: {
    color: '#007AFF', // iOS blue for active state
    fontWeight: '600',
  },
  unfocusedLabel: {
    color: '#8e8e93', // iOS secondary text color
  },
}); 