import { useState, useRef, useCallback } from 'react';
import { Animated } from 'react-native';

interface UseScrollLinkedDetectionProps {
  onScrollEnd?: (direction: 'up' | 'down') => void;
  scrollViewHeight?: number;
  contentHeight?: number;
  headerHeight?: number;
}

export const useScrollLinkedDetection = ({
  onScrollEnd,
  scrollViewHeight = 0,
  contentHeight = 0,
  headerHeight = 80
}: UseScrollLinkedDetectionProps = {}) => {
  const [scrollY] = useState(() => new Animated.Value(0));
  const lastScrollY = useRef(0);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const isAtTop = useRef(false);
  const isAtBottom = useRef(false);

  const handleScroll = useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDifference = currentScrollY - lastScrollY.current;
    
    // Only process if this is a real user scroll (not bounce)
    const isRealScroll = Math.abs(scrollDifference) > 3;
    const isBounce = currentScrollY < 0;
    
    if (isRealScroll && !isBounce) {
      // Update scroll position for 1:1 animation
      scrollY.setValue(Math.max(0, currentScrollY));
      
      // Update extreme positions
      isAtTop.current = currentScrollY <= 0;
      isAtBottom.current = contentHeight > 0 && 
        currentScrollY + scrollViewHeight >= contentHeight - 10;

      // Clear any existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Set scrolling state
      isScrolling.current = true;

      // Debounce scroll end detection
      scrollTimeout.current = setTimeout(() => {
        isScrolling.current = false;
        
        // Determine snap direction based on scroll direction
        const direction = scrollDifference > 0 ? 'down' : 'up';
        
        if (isAtTop.current) {
          // Always show at top
          if (onScrollEnd) onScrollEnd('up');
        } else if (isAtBottom.current) {
          // Always show at bottom
          if (onScrollEnd) onScrollEnd('up');
        } else {
          // Snap based on scroll direction
          if (onScrollEnd) onScrollEnd(direction);
        }
      }, 150);

      lastScrollY.current = currentScrollY;
    }
  }, [scrollY, onScrollEnd, scrollViewHeight, contentHeight, headerHeight]);

  return {
    scrollY,
    handleScroll,
    isAtTop: isAtTop.current,
    isAtBottom: isAtBottom.current,
    isScrolling: isScrolling.current,
  };
}; 