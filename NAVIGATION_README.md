# Navigation System

## Overview

The Neurotype app uses React Navigation 7 with a custom bottom tab bar and stack navigators for each tab. The navigation system provides smooth iOS-style transitions and custom navigation components for specific screens.

## Navigation Structure

### Main Navigation
- **Bottom Tab Navigator**: Four main tabs (Today, Progress, Explore, Profile)
- **Stack Navigators**: Each tab has its own stack for nested screens
- **Modal Presentation**: Meditation player presented as full-screen modal

### Tab Structure
```
Tab Navigator
├── Today Stack
│   ├── TodayMain (TodayScreen)
│   ├── Roadmap (RoadmapScreen)
│   └── MeditationDetail (MeditationDetailScreen)
├── Progress Stack
│   └── ProgressMain (ProgressScreen)
├── Explore Stack
│   ├── ExploreMain (ExploreScreen)
│   ├── ModuleDetail (ModuleDetailScreen)
│   └── MeditationDetail (MeditationDetailScreen)
└── Profile Stack
    ├── ProfileMain (ProfileScreen)
    ├── Settings (SettingsScreen)
    ├── Subscription (SubscriptionScreen)
    └── Payment (PaymentScreen)
```

## Components

### AnimatedTabBar
Custom animated bottom tab bar with smooth transitions and active state indicators.

**Location**: `src/components/AnimatedTabBar.tsx`

**Features**:
- Smooth tab switching animations
- Active tab highlighting
- Custom tab icons
- Gesture support

**Usage**:
```tsx
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
```

### TopNav
Simple static header component for screens that don't need scroll behavior.

**Location**: `src/components/TopNav.tsx`

**Props**:
- `title: string` - Screen title
- `showBackButton?: boolean` - Show back button
- `onBackPress?: () => void` - Custom back handler
- `rightComponent?: React.ReactNode` - Right side content
- `titleMaxLength?: number` - Max title length

**Usage**:
```tsx
import { TopNav } from '../components/TopNav';

<TopNav
  title="Settings"
  showBackButton={true}
  onBackPress={() => navigation.goBack()}
  rightComponent={<CustomButton />}
/>
```

### InstagramStyleNav
Scroll-aware navigation component that hides/shows on scroll, inspired by Instagram's navigation behavior.

**Location**: `src/components/InstagramStyleNav.tsx`

**Features**:
- Two-layer design (TopShell + RevealBar)
- Scroll-based hide/show behavior
- Smooth animations
- Search component support

**Props**:
- `title?: string | React.ReactNode` - Screen title
- `searchComponent?: React.ReactNode` - Search bar component
- `showBackButton?: boolean` - Show back button
- `onBackPress?: () => void` - Custom back handler
- `leftComponent?: React.ReactNode` - Left side content
- `rightComponent?: React.ReactNode` - Right side content
- `scrollY?: Animated.Value` - Scroll position for 1:1 movement
- `onScrollEnd?: (direction: 'up' | 'down') => void` - Scroll end callback
- `contentHeight?: number` - Content height for bottom detection
- `scrollViewHeight?: number` - Scroll view height for bottom detection
- `isSearchFocused?: boolean` - Search focus state
- `forceInitialPosition?: 'up' | 'down'` - Force initial position

**Ref Methods**:
- `showRevealBar()` - Programmatically show the RevealBar
- `hideRevealBar()` - Programmatically hide the RevealBar
- `snapToNearest()` - Snap to the nearest state

**Usage**:
```tsx
import { InstagramStyleNav, InstagramStyleNavRef } from '../components/InstagramStyleNav';

const navRef = useRef<InstagramStyleNavRef>(null);

<InstagramStyleNav
  ref={navRef}
  title="Screen Title"
  showBackButton={true}
  onBackPress={() => navigation.goBack()}
  rightComponent={<CustomButton />}
  scrollY={scrollY}
  searchComponent={<SearchBar />}
  onScrollEnd={(direction) => {
    // Handle scroll end
  }}
/>
```

### ExploreScreenNav
Specialized navigation component for the Explore screen with search and filter support.

**Location**: `src/components/ExploreScreenNav.tsx`

**Features**:
- Integrated search bar
- Filter support
- Scroll-aware behavior
- Module selection

## Screen Transitions

### iOS-Style Transitions
All stack navigators use iOS-style card transitions with optimized timing:

```typescript
cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
transitionSpec: {
  open: {
    animation: 'timing',
    config: { duration: 250 },
  },
  close: {
    animation: 'timing',
    config: { duration: 80, easing: Easing.out(Easing.cubic) },
  },
},
```

### Gesture Configuration
- **Gesture Enabled**: All stack screens support swipe-back gesture
- **Gesture Response Distance**: 60px for extra large response area
- **Gesture Velocity Impact**: 0.005 for minimal velocity needed
- **Gesture Direction**: Horizontal for iOS-style swipe

## Modal Presentation

### Meditation Player
The meditation player is presented as a full-screen modal:

```tsx
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
```

## Navigation Hooks

### useNavigation
Standard React Navigation hook for navigation actions:

```tsx
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();
navigation.navigate('ScreenName', { param: value });
navigation.goBack();
```

### useRoute
Access route parameters:

```tsx
import { useRoute } from '@react-navigation/native';

const route = useRoute();
const { sessionId } = route.params;
```

## Screen-Specific Navigation

### Today Screen
- Uses standard navigation with custom header
- Navigates to Roadmap and MeditationDetail screens
- Module selection affects recommendations

### Explore Screen
- Uses ExploreScreenNav component
- Supports search and filtering
- Navigates to ModuleDetail and MeditationDetail screens
- Module grid modal for module selection

### Profile Screen
- Uses TopNav for static header
- Navigates to Settings, Subscription, and Payment screens
- Account management flows

### Progress Screen
- Simple screen with static header
- Calendar and statistics views
- No nested navigation

## Custom Navigation Patterns

### Module-Based Navigation
Modules are selected and affect the context throughout the app:
- Today screen shows recommendations for selected module
- Explore screen can filter by module
- Session completion is tracked per module

### Session Flow
1. User selects session from Today/Explore
2. Opens MeditationDetailScreen
3. Starts session → Opens MeditationPlayerScreen (modal)
4. Completes session → Shows completion landing
5. Returns to previous screen

## Performance Considerations

- Uses `useNativeDriver: true` for all animations
- `scrollEventThrottle={1}` for maximum responsiveness
- Efficient re-renders with proper memoization
- Optimized gesture handlers with Reanimated

## Styling

Navigation components use the centralized theme:
- Colors from `theme.colors`
- Typography from `theme.typography`
- Spacing from `theme.spacing`
- Shadows from `theme.shadows`

All navigation maintains the app's paper-like aesthetic with consistent styling.

## Future Enhancements

- [ ] Deep linking support
- [ ] Navigation state persistence
- [ ] Advanced gesture customization
- [ ] Navigation analytics
- [ ] Accessibility improvements
