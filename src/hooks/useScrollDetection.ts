import { useState, useRef, useCallback } from 'react';

interface UseScrollDetectionProps {
  onScrollUp?: () => void;
  onScrollDown?: () => void;
  threshold?: number;
}

export const useScrollDetection = ({
  onScrollUp,
  onScrollDown,
  threshold = 10
}: UseScrollDetectionProps = {}) => {
  const [scrollY, setScrollY] = useState(0);
  const lastScrollY = useRef(0);

  const handleScroll = useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDifference = currentScrollY - lastScrollY.current;

    if (Math.abs(scrollDifference) > threshold) {
      if (scrollDifference > 0 && onScrollDown) {
        onScrollDown();
      } else if (scrollDifference < 0 && onScrollUp) {
        onScrollUp();
      }
      lastScrollY.current = currentScrollY;
    }

    setScrollY(currentScrollY);
  }, [onScrollUp, onScrollDown, threshold]);

  return {
    scrollY,
    handleScroll,
  };
}; 