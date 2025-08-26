# Instagram-Style Navigation System

## Overview

This navigation system implements Instagram-style header behavior with two distinct layers:

1. **TopShell** - A thin, always-visible strip pinned to the safe area/Dynamic Island
2. **RevealBar** - The actual toolbar (title + actions) that slides under the TopShell

## Behavior Specification

### Scroll Behavior
- **During scroll/drag**: RevealBar moves 1:1 with scroll (no easing)
- **Scrolling down**: RevealBar translates up (hides) up to its own height
- **Scrolling up**: RevealBar translates down (reveals)
- **Snap behavior**: Only after scrolling stops (drag end / momentum end) to nearest state (fully shown or fully hidden) with a short 140–180ms animation

### Position Behavior
- **At top of page**: RevealBar fully shown
- **Near bottom**: Keep RevealBar shown (but respect scroll direction)
- **At bottom scrolling down**: Keep RevealBar hidden
- **No layout jumps**: Content scrolls under the header; we don't reflow content height
- **No "stacking over" bug**: TopShell is above RevealBar; RevealBar slides under it, not on top of it

## Components

### InstagramStyleNav
The main navigation component that implements the Instagram-style behavior.

```tsx
import { InstagramStyleNav, InstagramStyleNavRef } from '../components/InstagramStyleNav';

// Usage
<InstagramStyleNav
  title="Screen Title"
  showBackButton={true}
  onBackPress={() => navigation.goBack()}
  rightComponent={<CustomButton />}
  scrollY={scrollY}
  onScrollEnd={(direction) => {
    // Handle scroll end events
  }}
/>
```

**Props:**
- `title: string` - The screen title
- `showBackButton?: boolean` - Whether to show the back button
- `onBackPress?: () => void` - Custom back button handler
- `rightComponent?: React.ReactNode` - Right side component
- `scrollY?: Animated.Value` - Scroll position for 1:1 movement
- `contentHeight?: number` - Content height for bottom detection
- `scrollViewHeight?: number` - Scroll view height for bottom detection
- `onScrollEnd?: (direction: 'up' | 'down') => void` - Scroll end callback

**Ref Methods:**
- `showRevealBar()` - Programmatically show the RevealBar
- `hideRevealBar()` - Programmatically hide the RevealBar
- `snapToNearest()` - Snap to the nearest state

### InstagramStyleScreen
A screen wrapper that integrates the navigation with scroll handling.

```tsx
import { InstagramStyleScreen } from '../components/InstagramStyleScreen';

// Usage
<InstagramStyleScreen title="Screen Title">
  <YourContent />
</InstagramStyleScreen>
```

**Props:**
- `title: string` - The screen title
- `showBackButton?: boolean` - Whether to show the back button
- `onBackPress?: () => void` - Custom back button handler
- `rightComponent?: React.ReactNode` - Right side component
- `children: React.ReactNode` - Screen content
- `style?: any` - Container style
- `contentStyle?: any` - Content container style
- `scrollViewStyle?: any` - ScrollView style

### TopNav
A simple static header for screens that don't need scroll behavior.

```tsx
import { TopNav } from '../components/TopNav';

// Usage
<TopNav
  title="Static Screen"
  showBackButton={true}
  rightComponent={<CustomButton />}
/>
```

## Hooks

### useInstagramScrollDetection
Custom hook that handles scroll detection for the Instagram-style behavior.

```tsx
import { useInstagramScrollDetection } from '../hooks/useInstagramScrollDetection';

const { scrollY, handleScroll, isAtTop, isAtBottom, isScrolling } = useInstagramScrollDetection({
  onScrollEnd: (direction) => {
    // Handle scroll end
  },
  scrollViewHeight: 600,
  contentHeight: 1200,
  headerHeight: 120,
});
```

**Returns:**
- `scrollY: Animated.Value` - Scroll position for 1:1 animation
- `handleScroll: (event: any) => void` - Scroll event handler
- `isAtTop: boolean` - Whether at the top of content
- `isAtBottom: boolean` - Whether at the bottom of content
- `isScrolling: boolean` - Whether currently scrolling

## Implementation Details

### Layout Structure
```
┌─────────────────────────┐
│      TopShell (60px)    │ ← Always visible, status bar padding
├─────────────────────────┤
│    RevealBar (60px)     │ ← Slides under TopShell during scroll
├─────────────────────────┤
│                         │
│      Content Area       │ ← Scrolls under header
│                         │
└─────────────────────────┘
```

### Animation Timing
- **Scroll movement**: 1:1 with scroll (no easing)
- **Snap animation**: 160ms timing animation
- **Scroll end detection**: 150ms debounce

### Z-Index Layering
- TopShell: `zIndex: 1000`
- RevealBar: Slides under TopShell
- Content: Scrolls under both layers

## Migration from Old System

### Removed Components
- `ScrollAwareTopNav`
- `TwoLayerHeader`
- `ScrollAwareScreen`
- `TwoLayerScreen`
- `withScrollAwareNav`
- `SearchTopNav`

### Removed Hooks
- `useScrollDetection`
- `useTwoLayerScrollDetection`
- `useScrollLinkedDetection`

### Updated Screens
All screens have been updated to use the new `InstagramStyleScreen`:
- `TodayScreen`
- `ExploreScreen`
- `ProgressScreen`
- `ProfileScreen`

## Visual Style

The navigation maintains the existing paper-like aesthetic:
- **Colors**: Uses theme colors (surface, primary, secondary)
- **Typography**: Uses theme typography settings
- **Shadows**: Uses theme shadow definitions
- **Borders**: Uses theme border styles
- **Spacing**: Uses theme spacing values

No visual changes were made to maintain consistency with the existing design system.

## Testing

Use the `DemoScreen` component to test the navigation behavior:

```tsx
import { DemoScreen } from '../screens/DemoScreen';

// Add to your navigation stack for testing
```

The demo screen includes:
- Scrollable content to test hide/show behavior
- Bottom content to test "near bottom" behavior
- Visual indicators for scroll position

## Performance Considerations

- Uses `useNativeDriver: true` for all animations
- `scrollEventThrottle={1}` for maximum responsiveness
- Debounced scroll end detection to prevent excessive snap animations
- Efficient re-renders with proper memoization 