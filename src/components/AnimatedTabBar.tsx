import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TodayIcon, ProgressIcon, ExploreIcon, ProfileIcon } from './icons';
import { useTheme } from '../contexts/ThemeContext';

export const AnimatedTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation
}) => {
  const theme = useTheme();
  const isDark = theme.isDark;
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

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

  const accentColor = theme.colors.accent;
  const inactiveColor = '#8E8E93';

  return (
    <View style={[styles.container, { height: 55 + bottomInset }]}>
      <BlurView
        tint={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
        intensity={80}
        style={[
          styles.blurContainer,
          { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' },
        ]}
      >
        <View style={[styles.tabRow, { paddingBottom: bottomInset }]}>
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

            const iconColor = isFocused ? accentColor : inactiveColor;
            const textColor = isFocused ? accentColor : inactiveColor;

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
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
    overflow: 'hidden',
    zIndex: 1000,
  },
  blurContainer: {
    flex: 1,
    borderTopWidth: 0.5,
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
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
