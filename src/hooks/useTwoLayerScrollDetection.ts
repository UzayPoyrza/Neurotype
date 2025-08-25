import { useState, useRef, useCallback } from 'react';

interface UseTwoLayerScrollDetectionProps {
  onScrollUp?: () => void;
  onScrollDown?: () => void;
  threshold?: number;
  scrollViewHeight?: number;
  contentHeight?: number;
}

export const useTwoLayerScrollDetection = ({
  onScrollUp,
  onScrollDown,
  threshold = 0,
  scrollViewHeight = 0,
  contentHeight = 0
}: UseTwoLayerScrollDetectionProps = {}) => {
  const [scrollY, setScrollY] = useState(0);
  const lastScrollY = useRef(0);
  const lastScrollDirection = useRef<'up' | 'down' | null>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const isAtTop = useRef(false);
  const isAtBottom = useRef(false);

  const handleScroll = useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDifference = currentScrollY - lastScrollY.current;
    
    // Update extreme positions
    isAtTop.current = currentScrollY <= 0;
    isAtBottom.current = contentHeight > 0 && 
      currentScrollY + scrollViewHeight >= contentHeight - 10;

    // True 1:1 response - respond to every scroll event
    if (scrollDifference !== 0) {
      const currentDirection = scrollDifference > 0 ? 'down' : 'up';
      
      // Always show reveal bar when at the top
      if (isAtTop.current && onScrollUp) {
        onScrollUp();
      }
      // Don't hide reveal bar when at the bottom
      else if (isAtBottom.current && currentDirection === 'down') {
        // Do nothing - keep reveal bar visible at bottom
      }
      // True 1:1 response for all other cases
      else {
        if (currentDirection === 'down' && onScrollDown) {
          onScrollDown();
        } else if (currentDirection === 'up' && onScrollUp) {
          onScrollUp();
        }
      }
      
      lastScrollY.current = currentScrollY;
    }

    setScrollY(currentScrollY);
  }, [onScrollUp, onScrollDown, scrollViewHeight, contentHeight]);

  return {
    scrollY,
    handleScroll,
    isAtTop: isAtTop.current,
    isAtBottom: isAtBottom.current,
  };
}; 