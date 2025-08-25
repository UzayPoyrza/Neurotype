import React, { useRef, useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, LayoutChangeEvent } from 'react-native';
import { ScrollAwareTopNav, ScrollAwareTopNavRef } from './ScrollAwareTopNav';
import { useScrollDetection } from '../hooks/useScrollDetection';
import { theme } from '../styles/theme';

interface ScrollAwareScreenProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  forceNavVisible?: boolean;
  children: React.ReactNode;
  style?: any;
  contentStyle?: any;
  scrollViewStyle?: any;
}

export const ScrollAwareScreen: React.FC<ScrollAwareScreenProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightComponent,
  forceNavVisible = false,
  children,
  style,
  contentStyle,
  scrollViewStyle,
}) => {
  const navRef = useRef<ScrollAwareTopNavRef>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  
  const { handleScroll } = useScrollDetection({
    onScrollUp: () => {
      if (navRef.current) {
        navRef.current.showNavBar();
      }
    },
    onScrollDown: () => {
      if (navRef.current) {
        navRef.current.hideNavBar();
      }
    },
    threshold: 15, // Increased threshold for better stability
    scrollViewHeight,
    contentHeight,
  });

  const handleScrollWithDebounce = useCallback((event: any) => {
    handleScroll(event);
  }, [handleScroll]);

  const handleScrollViewLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setScrollViewHeight(height);
  }, []);

  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setContentHeight(height);
  }, []);

  return (
    <View style={[styles.container, style]}>
      <ScrollAwareTopNav
        ref={navRef}
        title={title}
        showBackButton={showBackButton}
        onBackPress={onBackPress}
        rightComponent={rightComponent}
        forceVisible={forceNavVisible}
      />
      <ScrollView
        ref={scrollViewRef}
        style={[styles.scrollView, scrollViewStyle]}
        contentContainerStyle={[styles.contentContainer, contentStyle]}
        onScroll={handleScrollWithDebounce}
        scrollEventThrottle={16}
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
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    paddingTop: 80, // Account for the navigation bar height
  },
  contentContainer: {
    flexGrow: 1,
  },
}); 