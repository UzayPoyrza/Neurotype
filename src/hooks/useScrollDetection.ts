import { useState, useRef, useCallback } from 'react';

interface UseScrollDetectionProps {
  onScrollUp?: () => void;
  onScrollDown?: () => void;
  threshold?: number;
  scrollViewHeight?: number;
  contentHeight?: number;
}

export const useScrollDetection = ({
  onScrollUp,
  onScrollDown,
  threshold = 10,
  scrollViewHeight = 0,
  contentHeight = 0
}: UseScrollDetectionProps = {}) => {
  const [scrollY, setScrollY] = useState(0);
  const lastScrollY = useRef(0);
  const lastScrollDirection = useRef<'up' | 'down' | null>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDifference = currentScrollY - lastScrollY.current;
    
    // Clear any existing timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    // Check if we're at the bottom of the content
    const isAtBottom = contentHeight > 0 && 
      currentScrollY + scrollViewHeight >= contentHeight - 10; // 10px tolerance
    
    // Check if we're at the top
    const isAtTop = currentScrollY <= 0;

    // Only process scroll if we have enough difference and we're not at the bottom
    if (Math.abs(scrollDifference) > threshold && !isAtBottom) {
      const currentDirection = scrollDifference > 0 ? 'down' : 'up';
      
      // Only trigger if direction changed or we're at the top
      if (lastScrollDirection.current !== currentDirection || isAtTop) {
        if (currentDirection === 'down' && onScrollDown && !isAtBottom) {
          onScrollDown();
        } else if (currentDirection === 'up' && onScrollUp) {
          onScrollUp();
        }
        
        lastScrollDirection.current = currentDirection;
      }
      
      lastScrollY.current = currentScrollY;
    }

    // Debounce the scroll event to prevent excessive updates
    scrollTimeout.current = setTimeout(() => {
      setScrollY(currentScrollY);
    }, 16); // ~60fps
  }, [onScrollUp, onScrollDown, threshold, scrollViewHeight, contentHeight]);

  return {
    scrollY,
    handleScroll,
  };
}; 