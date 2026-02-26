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

  // Check if we're on Subscription or Payment screen
  const shouldHideTabBar = React.useMemo(() => {
    // Find the Profile tab route
    const profileRoute = state.routes.find(route => route.name === 'Profile');
    if (profileRoute?.state) {
      const profileState = profileRoute.state as any;
      const activeRouteName = profileState.routes[profileState.index]?.name;
      return activeRouteName === 'Subscription' || activeRouteName === 'Payment';
    }
    return false;
  }, [state]);

  // Hide tab bar if on Subscription or Payment screen
  if (shouldHideTabBar) {
    return null;
  }

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

        const iconColor = isFocused ? '#0A84FF' : '#636366';
        const textColor = isFocused ? '#0A84FF' : '#636366';

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
    borderTopWidth: 0.5,
    borderTopColor: '#38383A',
    paddingBottom: 20,
    paddingTop: 8,
    height: 85,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
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
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 