# SpotifyFilterBar Component

A React Native component that implements a Spotify-style filter bar with primary and secondary filter rows, smooth animations, and full accessibility support.

## Features

- **Horizontal scrolling primary filters** - Always visible, scrollable row of main filter categories
- **Secondary filter expansion** - Tap a primary chip to reveal sub-filters with smooth slide animation
- **Badge indicators** - Shows selection count on primary chips when filters are active
- **Single/Multi-select support** - Configurable selection modes per category
- **Smooth animations** - 200ms slide/fade transitions for secondary row
- **Full accessibility** - Screen reader support with proper labels and states
- **Responsive design** - Works smoothly on small screens
- **Theme integration** - Uses centralized design tokens for easy customization

## Usage

```tsx
import { SpotifyFilterBar, FilterCategory, FilterSelection } from './SpotifyFilterBar';

const MyComponent = () => {
  const [filterSelection, setFilterSelection] = useState<FilterSelection | undefined>();

  const categories: FilterCategory[] = [
    {
      id: 'genre',
      label: 'Genre',
      multiSelect: false,
      options: [
        { id: 'all', label: 'All Genres' },
        { id: 'pop', label: 'Pop', badge: 125 },
        { id: 'rock', label: 'Rock', badge: 89 },
      ],
    },
    {
      id: 'mood',
      label: 'Mood',
      multiSelect: true,
      options: [
        { id: 'all', label: 'All Moods' },
        { id: 'energetic', label: 'Energetic', badge: 156 },
        { id: 'chill', label: 'Chill', badge: 134 },
      ],
    },
  ];

  const handleFilterSelectionChange = (selection: FilterSelection) => {
    setFilterSelection(selection);
    // Handle filter logic here
  };

  return (
    <SpotifyFilterBar
      categories={categories}
      onSelectionChange={handleFilterSelectionChange}
      initialSelection={filterSelection}
    />
  );
};
```

## Props

### SpotifyFilterBarProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `categories` | `FilterCategory[]` | Yes | Array of filter categories with their options |
| `onSelectionChange` | `(selection: FilterSelection) => void` | Yes | Callback when filter selection changes |
| `initialSelection` | `FilterSelection \| undefined` | No | Initial filter selection state |
| `style` | `ViewStyle` | No | Additional styles for the container |

### FilterCategory

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for the category |
| `label` | `string` | Yes | Display label for the primary chip |
| `options` | `FilterOption[]` | Yes | Array of filter options for this category |
| `multiSelect` | `boolean` | No | Whether multiple options can be selected (default: false) |

### FilterOption

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for the option |
| `label` | `string` | Yes | Display label for the option |
| `badge` | `number` | No | Optional badge count to display |

### FilterSelection

| Property | Type | Description |
|----------|------|-------------|
| `parentId` | `string` | ID of the parent category |
| `optionIds` | `string[]` | Array of selected option IDs |

## Behavior

### Primary Row
- Always visible and horizontally scrollable
- Shows all filter categories as pill-shaped chips
- Active category is highlighted with inverted colors
- Badge shows selection count when filters are active

### Secondary Row
- Slides in from top when a primary chip is tapped
- Contains "× Back" chip and category-specific options
- Smooth 200ms slide/fade animation
- Horizontal scrolling for many options

### Selection Modes
- **Single-select**: Only one option can be selected at a time
- **Multi-select**: Multiple options can be selected simultaneously
- "All" option typically resets selections for that category

### Accessibility
- Proper `accessibilityRole` and `accessibilityLabel` for all interactive elements
- `accessibilityState` indicates selected state
- Screen reader announces selection counts and current state
- Large hit areas for touch interaction

## Integration with InstagramStyleScreen

The component is designed to integrate seamlessly with the existing `InstagramStyleScreen`:

```tsx
<InstagramStyleScreen
  searchComponent={<SearchBar />}
  filterComponent={
    <SpotifyFilterBar
      categories={categories}
      onSelectionChange={handleSelectionChange}
    />
  }
>
  {/* Your content */}
</InstagramStyleScreen>
```

The screen automatically adjusts header height and scroll padding to accommodate the filter bar.

## Theme Integration

The component uses centralized theme tokens for consistent styling:

```tsx
// In theme.ts
colors: {
  filter: {
    active: '#000000',
    inactive: '#ffffff',
    border: '#000000',
    badge: '#90EE90',
    separator: '#e0e0e0',
  },
}
```

## Performance Considerations

- Uses `useCallback` for event handlers to prevent unnecessary re-renders
- Animated values are properly managed with `useRef`
- Layout animations are disabled on Android for better performance
- Efficient filtering logic with memoization support

## Example Implementation

See `SpotifyFilterBarDemo.tsx` for a complete working example with sample data and feature showcase.

## Styling Customization

All styles use theme tokens for easy customization. Key style properties:

- Chip appearance: `primaryChip`, `secondaryChip`
- Animation timing: 200ms for slide/fade transitions
- Spacing: Uses theme spacing tokens
- Colors: Uses theme color tokens
- Typography: Uses theme typography tokens

## Browser/Platform Support

- iOS: Full support with native animations
- Android: Full support with fallback animations
- Web: Full support (React Native Web compatible) 