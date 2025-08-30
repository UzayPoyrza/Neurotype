import React, { useRef, useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, LayoutChangeEvent } from 'react-native';
import { ExploreScreenNav, ExploreScreenNavRef } from './ExploreScreenNav';
import { useInstagramScrollDetection } from '../hooks/useInstagramScrollDetection';
import { theme } from '../styles/theme';

interface ExploreScreenProps {
  title?: string;
  titleComponent?: React.ReactNode;
  searchComponent?: React.ReactNode;
  filterCategories: any[];
  onFilterSelectionChange: (selection: any) => void;
  filterSelection?: any;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  children: React.ReactNode;
  style?: any;
  contentStyle?: any;
  scrollViewStyle?: any;
  isSearchFocused?: boolean;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  title,
  titleComponent,
  searchComponent,
  filterCategories,
  onFilterSelectionChange,
  filterSelection,
  showBackButton = false,
  onBackPress,
  rightComponent,
  children,
  style,
  contentStyle,
  scrollViewStyle,
  isSearchFocused = false,
}) => {
  const navRef = useRef<ExploreScreenNavRef>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const headerHeight = 180; // TopShell (60) + RevealBar (120)
  
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
    <View style={[styles.container, style]}>
      <ExploreScreenNav
        ref={navRef}
        title={title}
        titleComponent={titleComponent}
        searchComponent={searchComponent}
        filterCategories={filterCategories}
        onFilterSelectionChange={onFilterSelectionChange}
        filterSelection={filterSelection}
        showBackButton={showBackButton}
        onBackPress={onBackPress}
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
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    paddingTop: 180, // Account for TopShell (60) + RevealBar (120)
  },
  contentContainer: {
    flexGrow: 1,
  },
}); 