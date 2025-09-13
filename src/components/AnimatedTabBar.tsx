import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TodayIcon, ProgressIcon, ExploreIcon, ProfileIcon } from './icons';
import { useStore } from '../store/useStore';

export const AnimatedTabBar: React.FC<BottomTabBarProps> = ({ 
  state, 
  descriptors, 
  navigation 
}) => {
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
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
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined 
          ? options.tabBarLabel 
          : options.title !== undefined 
          ? options.title 
          : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            handleTabPress(route, index);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const iconColor = isFocused ? '#007AFF' : '#5a5a5a';
        const textColor = isFocused ? '#000000' : '#5a5a5a';

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
          >
            <Animated.View 
              style={[
                styles.iconContainer,
                { transform: [{ scale: scaleAnimations[index] }] }
              ]}
            >
              {getIcon(route.name, isFocused, iconColor, 20)}
            </Animated.View>
            <Text style={[styles.label, { color: textColor }]}>
              {label}
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
    //borderTopWidth: 1,
    //borderTopColor: '#e0e0e0', // Subtle border
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 