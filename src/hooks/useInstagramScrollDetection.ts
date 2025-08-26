import { useState, useRef, useCallback } from 'react';
import { Animated } from 'react-native';

interface UseInstagramScrollDetectionProps {
  onScrollEnd?: (direction: 'up' | 'down') => void;
  scrollViewHeight?: number;
  contentHeight?: number;
  headerHeight?: number;
}

export const useInstagramScrollDetection = ({
  onScrollEnd,
  scrollViewHeight = 0,
  contentHeight = 0,
  headerHeight = 120 // TopShell (60) + RevealBar (60)
}: UseInstagramScrollDetectionProps = {}) => {
  const [scrollY] = useState(() => new Animated.Value(0));
  const lastScrollY = useRef(0);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const isAtTop = useRef(false);
  const isAtBottom = useRef(false);
  const lastScrollDirection = useRef<'up' | 'down' | null>(null);

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

      // Check if we're in the bottom 10% of the page
      const scrollableHeight = contentHeight - scrollViewHeight;
      const bottom5PercentThreshold = scrollableHeight * 0.9999;
      const isInBottom10Percent = currentScrollY >= bottom5PercentThreshold;

      // Clear any existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Set scrolling state
      isScrolling.current = true;
      lastScrollDirection.current = scrollDifference > 0 ? 'down' : 'up';

      // Debounce scroll end detection for snap behavior
      scrollTimeout.current = setTimeout(() => {
        isScrolling.current = false;
        
        // Determine snap direction based on scroll direction and position
        if (isAtTop.current) {
          // Always show at top
          if (onScrollEnd) onScrollEnd('up');
        } else if (isInBottom10Percent) {
          // In bottom 10% - never reveal header, always hide
          if (onScrollEnd) onScrollEnd('down');
        } else if (isAtBottom.current && lastScrollDirection.current === 'up') {
          // Only show at bottom if scrolling up (but not in bottom 10%)
          if (onScrollEnd) onScrollEnd('up');
        } else if (isAtBottom.current && lastScrollDirection.current === 'down') {
          // At bottom and scrolling down - don't call onScrollEnd, let 1:1 movement handle it
          // Do nothing - the 1:1 movement will keep the RevealBar hidden
        } else {
          // Snap based on last scroll direction
          if (onScrollEnd && lastScrollDirection.current) {
            onScrollEnd(lastScrollDirection.current);
          }
        }
      }, 150); // Debounce time for scroll end detection

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