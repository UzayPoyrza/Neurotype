import React, { useRef, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { ScrollAwareTopNav, ScrollAwareTopNavRef } from './ScrollAwareTopNav';
import { useScrollDetection } from '../hooks/useScrollDetection';

interface WithScrollAwareNavProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  forceNavVisible?: boolean;
  children: React.ReactNode;
  style?: any;
  contentStyle?: any;
}

export const withScrollAwareNav = (WrappedComponent: React.ComponentType<any>) => {
  return React.forwardRef<any, any>((props, ref) => {
    const navRef = useRef<ScrollAwareTopNavRef>(null);
    
    const { handleScroll } = useScrollDetection({
      onScrollUp: () => navRef.current?.showNavBar(),
      onScrollDown: () => navRef.current?.hideNavBar(),
      threshold: 8, // Threshold to prevent flicker on tiny scrolls
    });

    const handleScrollWithDebounce = useCallback((event: any) => {
      // Debounce to avoid jitter during micro scrolls
      handleScroll(event);
    }, [handleScroll]);

    return (
      <View style={styles.container}>
        <ScrollAwareTopNav
          ref={navRef}
          title={props.title || 'Screen'}
          showBackButton={props.showBackButton}
          onBackPress={props.onBackPress}
          rightComponent={props.rightComponent}
          forceVisible={props.forceNavVisible}
        />
        <ScrollView
          style={[styles.scrollView, props.style]}
          contentContainerStyle={[styles.contentContainer, props.contentStyle]}
          onScroll={handleScrollWithDebounce}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <WrappedComponent {...props} ref={ref} />
        </ScrollView>
      </View>
    );
  });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Match your app's background
  },
  scrollView: {
    flex: 1,
    paddingTop: 80, // Account for the navigation bar height
  },
  contentContainer: {
    flexGrow: 1,
  },
}); 