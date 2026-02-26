import React, { useRef, useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, LayoutChangeEvent } from 'react-native';
import { InstagramStyleNav, InstagramStyleNavRef } from './InstagramStyleNav';
import { useInstagramScrollDetection } from '../hooks/useInstagramScrollDetection';
import { useTheme } from '../contexts/ThemeContext';

interface InstagramStyleScreenProps {
  title?: string | React.ReactNode;
  searchComponent?: React.ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  children: React.ReactNode;
  style?: any;
  contentStyle?: any;
  scrollViewStyle?: any;
  isSearchFocused?: boolean;
}

export const InstagramStyleScreen: React.FC<InstagramStyleScreenProps> = ({
  title,
  searchComponent,
  showBackButton = false,
  onBackPress,
  leftComponent,
  rightComponent,
  children,
  style,
  contentStyle,
  scrollViewStyle,
  isSearchFocused = false,
}) => {
  const theme = useTheme();
  const navRef = useRef<InstagramStyleNavRef>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const headerHeight = 120; // TopShell (60) + RevealBar (60)

  const { scrollY, handleScroll, handleTouchStart, handleTouchEnd } = useInstagramScrollDetection({
    onScrollEnd: (direction) => {
      if (navRef.current && !isSearchFocused) {
        if (direction === 'up') {
          navRef.current.showRevealBar();
        } else {
          navRef.current.hideRevealBar();
        }
      }
    },
    scrollViewHeight,
    contentHeight,
    headerHeight,
  });

  const handleScrollViewLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setScrollViewHeight(height);
  }, []);

  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setContentHeight(height);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }, style]}>
      <InstagramStyleNav
        ref={navRef}
        title={title}
        searchComponent={searchComponent}
        showBackButton={showBackButton}
        onBackPress={onBackPress}
        leftComponent={leftComponent}
        rightComponent={rightComponent}
        scrollY={scrollY}
        contentHeight={contentHeight}
        scrollViewHeight={scrollViewHeight}
        isSearchFocused={isSearchFocused}
        onScrollEnd={(direction) => {
          if (direction === 'up') {
            navRef.current?.showRevealBar();
          } else {
            navRef.current?.hideRevealBar();
          }
        }}
      />
      <ScrollView
        ref={scrollViewRef}
        style={[styles.scrollView, scrollViewStyle]}
        contentContainerStyle={[styles.contentContainer, contentStyle]}
        onScroll={isSearchFocused ? undefined : handleScroll}
        onTouchStart={isSearchFocused ? undefined : handleTouchStart}
        onTouchEnd={isSearchFocused ? undefined : handleTouchEnd}
        scrollEventThrottle={1} // Maximum responsiveness for 1:1 movement
        showsVerticalScrollIndicator={false}
        onLayout={handleScrollViewLayout}
        onContentSizeChange={(width, height) => {
          setContentHeight(height);
        }}
      >
        <View onLayout={handleContentLayout}>
          {children}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingTop: 120, // Account for TopShell (60) + RevealBar (60)
  },
  contentContainer: {
    flexGrow: 1,
  },
});
