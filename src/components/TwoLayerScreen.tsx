import React, { useRef, useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, LayoutChangeEvent } from 'react-native';
import { TwoLayerHeader, TwoLayerHeaderRef } from './TwoLayerHeader';
import { useScrollLinkedDetection } from '../hooks/useScrollLinkedDetection';
import { theme } from '../styles/theme';

interface TwoLayerScreenProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  forceRevealVisible?: boolean;
  children: React.ReactNode;
  style?: any;
  contentStyle?: any;
  scrollViewStyle?: any;
}

export const TwoLayerScreen: React.FC<TwoLayerScreenProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightComponent,
  forceRevealVisible = false,
  children,
  style,
  contentStyle,
  scrollViewStyle,
}) => {
  const headerRef = useRef<TwoLayerHeaderRef>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const headerHeight = 80;
  
  const { scrollY, handleScroll } = useScrollLinkedDetection({
    onScrollEnd: (direction) => {
      if (headerRef.current) {
        if (direction === 'up') {
          headerRef.current.showRevealBar();
        } else {
          headerRef.current.hideRevealBar();
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
    <View style={[styles.container, style]}>
      <TwoLayerHeader
        ref={headerRef}
        title={title}
        showBackButton={showBackButton}
        onBackPress={onBackPress}
        rightComponent={rightComponent}
        forceRevealVisible={forceRevealVisible}
        scrollY={scrollY}
      />
      <ScrollView
        ref={scrollViewRef}
        style={[styles.scrollView, scrollViewStyle]}
        contentContainerStyle={[styles.contentContainer, contentStyle]}
        onScroll={handleScroll}
        scrollEventThrottle={1}
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
    paddingTop: 140, // Account for RevealBar (60) + TopShell (80)
  },
  contentContainer: {
    flexGrow: 1,
  },
}); 