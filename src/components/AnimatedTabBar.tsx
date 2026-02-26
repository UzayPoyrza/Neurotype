import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Text } from 'react-native';
import { BlurView } from 'expo-blur';
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
    // Squeeze animation
    const scaleAnimation = scaleAnimations[index];

    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.7,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to the route
    navigation.navigate(route.name);
  };

  const getIcon = (routeName: string, focused: boolean, color: string, size: number) => {
    const iconSize = size + 4;

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
    <View style={styles.container}>
      <BlurView
        tint="systemChromeMaterialDark"
        intensity={80}
        style={styles.blurContainer}
      >
        <View style={styles.tabRow}>
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

            const iconColor = isFocused ? '#0A84FF' : '#8E8E93';
            const textColor = isFocused ? '#0A84FF' : '#8E8E93';

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
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    overflow: 'hidden',
    zIndex: 1000,
  },
  blurContainer: {
    flex: 1,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    paddingBottom: 20,
    paddingTop: 8,
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
