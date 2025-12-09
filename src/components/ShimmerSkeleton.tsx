import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';

type ShimmerSkeletonProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create infinite loop animation
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );

    shimmerAnimation.start();

    return () => {
      shimmerAnimation.stop();
    };
  }, [shimmerAnim]);

  // Interpolate the shimmer position - sweep from left to right
  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  // Bright white sweep with smooth fade in/out
  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.4, 0.5, 0.6, 1],
    outputRange: [0, 0.8, 1, 0.8, 0],
  });

  return (
    <View
      style={[
        styles.container,
        {
          width: width as any,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      {/* Grey base */}
      <View style={[styles.base, { borderRadius }]} />
      
      {/* Shimmer overlay - bright white sweep */}
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerTranslateX }],
            opacity: shimmerOpacity,
          },
        ]}
      >
        {/* Gradient-like effect using a bright white rectangle */}
        <View style={styles.shimmerInner} />
      </Animated.View>
    </View>
  );
};

type ShimmerCardProps = {
  style?: ViewStyle;
};

export const ShimmerSessionCard: React.FC<ShimmerCardProps> = ({ style }) => {
  return (
    <View style={[styles.cardContainer, style]}>
      <View style={styles.cardContent}>
        {/* Title skeleton */}
        <ShimmerSkeleton width="70%" height={18} borderRadius={6} style={styles.titleSkeleton} />
        
        {/* Subtitle skeleton */}
        <ShimmerSkeleton width="50%" height={14} borderRadius={6} style={styles.subtitleSkeleton} />
        
        {/* Meta skeleton */}
        <ShimmerSkeleton width="40%" height={12} borderRadius={6} style={styles.metaSkeleton} />
      </View>
      
      {/* Play button skeleton */}
      <ShimmerSkeleton width={44} height={44} borderRadius={22} />
    </View>
  );
};

export const ShimmerAlternativeSessionCard: React.FC<ShimmerCardProps> = ({ style }) => {
  return (
    <View style={[styles.alternativeCardContainer, style]}>
      <View style={styles.alternativeCardContent}>
        {/* Title skeleton */}
        <ShimmerSkeleton width="65%" height={16} borderRadius={6} style={styles.alternativeTitleSkeleton} />
        
        {/* Meta skeleton */}
        <ShimmerSkeleton width="45%" height={12} borderRadius={6} style={styles.alternativeMetaSkeleton} />
      </View>
      
      {/* Play button skeleton */}
      <ShimmerSkeleton width={36} height={36} borderRadius={18} />
    </View>
  );
};

export const ShimmerCalendarCard: React.FC<ShimmerCardProps> = ({ style }) => {
  return (
    <View style={[styles.calendarCardContainer, style]}>
      {/* Header */}
      <View style={styles.calendarHeader}>
        <ShimmerSkeleton width={36} height={36} borderRadius={18} />
        <ShimmerSkeleton width="40%" height={20} borderRadius={6} />
        <ShimmerSkeleton width={36} height={36} borderRadius={18} />
      </View>

      {/* Day Headers */}
      <View style={styles.calendarDayHeaders}>
        {[...Array(7)].map((_, i) => (
          <ShimmerSkeleton key={i} width="100%" height={14} borderRadius={4} style={styles.calendarDayHeader} />
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {[...Array(6)].map((_, rowIndex) => (
          <View key={rowIndex} style={styles.calendarRow}>
            {[...Array(7)].map((_, colIndex) => (
              <ShimmerSkeleton key={colIndex} width="100%" height={40} borderRadius={8} style={styles.calendarCell} />
            ))}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.calendarLegend}>
        <ShimmerSkeleton width="30%" height={16} borderRadius={6} style={styles.calendarLegendTitle} />
        <View style={styles.calendarLegendItems}>
          {[...Array(3)].map((_, i) => (
            <View key={i} style={styles.calendarLegendItem}>
              <ShimmerSkeleton width={12} height={12} borderRadius={6} style={styles.calendarLegendDot} />
              <ShimmerSkeleton width={60} height={14} borderRadius={4} style={styles.calendarLegendText} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export const ShimmerSessionsCard: React.FC<ShimmerCardProps> = ({ style }) => {
  return (
    <View style={[styles.sessionsCardContainer, style]}>
      {/* Card Header */}
      <View style={styles.cardHeaderTop}>
        <ShimmerSkeleton width="30%" height={17} borderRadius={6} />
      </View>

      {/* Sessions Content */}
      <View style={styles.sessionsContent}>
        {[...Array(3)].map((_, i) => (
          <View key={i} style={styles.sessionStatSkeleton}>
            <ShimmerSkeleton width="60%" height={15} borderRadius={6} style={styles.sessionLabelSkeleton} />
            <ShimmerSkeleton width="40%" height={24} borderRadius={6} style={styles.sessionValueSkeleton} />
          </View>
        ))}
      </View>
    </View>
  );
};

export const ShimmerProgressPathCard: React.FC<ShimmerCardProps> = ({ style }) => {
  return (
    <View style={[styles.progressPathCardContainer, style]}>
      {/* Header */}
      <View style={styles.progressPathHeader}>
        {/* Badge skeleton */}
        <ShimmerSkeleton width={40} height={40} borderRadius={20} style={styles.progressPathBadgeSkeleton} />
        
        {/* Title and subtitle */}
        <View style={styles.progressPathHeaderText}>
          <ShimmerSkeleton width="60%" height={17} borderRadius={6} style={styles.progressPathTitleSkeleton} />
          <ShimmerSkeleton width="80%" height={14} borderRadius={6} style={styles.progressPathSubtitleSkeleton} />
        </View>
      </View>

      {/* Timeline section */}
      <View style={styles.progressPathTimeline}>
        {/* Left column - Completed */}
        <View style={styles.progressPathColumn}>
          <ShimmerSkeleton width="50%" height={13} borderRadius={6} style={styles.progressPathSectionLabelSkeleton} />
          {/* 3 completed items with icon and text */}
          <View style={styles.progressPathItemRow}>
            <ShimmerSkeleton width={28} height={28} borderRadius={14} />
            <View style={styles.progressPathItemText}>
              <ShimmerSkeleton width="80%" height={13} borderRadius={6} style={styles.progressPathItemTitle} />
              <ShimmerSkeleton width="50%" height={12} borderRadius={6} style={styles.progressPathItemMeta} />
            </View>
          </View>
          <View style={styles.progressPathItemRow}>
            <ShimmerSkeleton width={28} height={28} borderRadius={14} />
            <View style={styles.progressPathItemText}>
              <ShimmerSkeleton width="75%" height={13} borderRadius={6} style={styles.progressPathItemTitle} />
              <ShimmerSkeleton width="45%" height={12} borderRadius={6} style={styles.progressPathItemMeta} />
            </View>
          </View>
          <View style={styles.progressPathItemRow}>
            <ShimmerSkeleton width={28} height={28} borderRadius={14} />
            <View style={styles.progressPathItemText}>
              <ShimmerSkeleton width="70%" height={13} borderRadius={6} style={styles.progressPathItemTitle} />
              <ShimmerSkeleton width="40%" height={12} borderRadius={6} style={styles.progressPathItemMeta} />
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.progressPathDivider} />

        {/* Right column - Coming Up */}
        <View style={styles.progressPathColumn}>
          <ShimmerSkeleton width="50%" height={13} borderRadius={6} style={styles.progressPathSectionLabelSkeleton} />
          <View style={styles.progressPathItemRow}>
            <ShimmerSkeleton width={36} height={36} borderRadius={18} />
            <View style={styles.progressPathItemText}>
              <ShimmerSkeleton width="65%" height={12} borderRadius={6} style={styles.progressPathItemTitle} />
            </View>
          </View>
        </View>
      </View>

      {/* Timeline Progress Section */}
      <View style={styles.progressPathTimelineSection}>
        {/* Header */}
        <View style={styles.progressPathTimelineHeader}>
          <ShimmerSkeleton width="55%" height={13} borderRadius={6} />
          <ShimmerSkeleton width="15%" height={13} borderRadius={6} />
        </View>
        
        {/* Progress bar */}
        <ShimmerSkeleton width="100%" height={6} borderRadius={3} style={styles.progressPathBarSkeleton} />
        
        {/* Progress text */}
        <ShimmerSkeleton width="70%" height={12} borderRadius={6} style={styles.progressPathTextSkeleton} />
      </View>

      {/* Footer */}
      <View style={styles.progressPathFooter}>
        <ShimmerSkeleton width="60%" height={13} borderRadius={6} />
        <ShimmerSkeleton width={20} height={20} borderRadius={10} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  base: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#e5e5ea', // Grey placeholder
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 200,
    left: '50%',
    marginLeft: -100, // Center the shimmer initially
  },
  shimmerInner: {
    flex: 1,
    backgroundColor: '#ffffff',
    width: '100%',
    // Bright white with slight transparency at edges for smooth sweep
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 15,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardContent: {
    flex: 1,
    marginRight: 16,
  },
  titleSkeleton: {
    marginBottom: 4,
  },
  subtitleSkeleton: {
    marginBottom: 8,
  },
  metaSkeleton: {
    marginTop: 4,
  },
  alternativeCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  alternativeCardContent: {
    flex: 1,
    marginRight: 16,
  },
  alternativeTitleSkeleton: {
    marginBottom: 2,
  },
  alternativeMetaSkeleton: {
    marginTop: 2,
  },
  progressPathCardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  progressPathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressPathBadgeSkeleton: {
    marginRight: 12,
  },
  progressPathHeaderText: {
    flex: 1,
  },
  progressPathTitleSkeleton: {
    marginBottom: 4,
  },
  progressPathSubtitleSkeleton: {
    marginTop: 4,
  },
  progressPathTimeline: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f2f2f7',
    backgroundColor: '#f9f9fb',
    paddingHorizontal: 14,
    paddingVertical: 18,
    marginBottom: 16,
  },
  progressPathColumn: {
    flex: 1,
  },
  progressPathSectionLabelSkeleton: {
    marginBottom: 8,
  },
  progressPathItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressPathItemText: {
    flex: 1,
    marginLeft: 8,
  },
  progressPathItemTitle: {
    marginBottom: 2,
  },
  progressPathItemMeta: {
    marginTop: 2,
  },
  progressPathDivider: {
    width: 1,
    backgroundColor: '#e5e5ea',
    marginHorizontal: 12,
    borderRadius: 0.5,
  },
  progressPathTimelineSection: {
    marginTop: 16,
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f2f2f7',
  },
  progressPathTimelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressPathBarSkeleton: {
    marginBottom: 6,
  },
  progressPathTextSkeleton: {
    marginTop: 6,
  },
  progressPathFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calendarCardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 450, // Constant size to match calendar
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  calendarNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  calendarHeaderTitle: {
    width: '40%',
    height: 20,
    borderRadius: 6,
  },
  calendarDayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarDayHeader: {
    flex: 1,
    height: 14,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  calendarGrid: {
    height: 280, // Match calendar height
    marginBottom: 12,
  },
  calendarRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calendarCell: {
    width: '14.28%',
    height: 40,
    borderRadius: 8,
    marginHorizontal: 1,
  },
  calendarLegend: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  calendarLegendTitle: {
    width: '30%',
    height: 16,
    borderRadius: 6,
    marginBottom: 8,
  },
  calendarLegendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 6,
  },
  calendarLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  calendarLegendText: {
    width: 60,
    height: 14,
    borderRadius: 4,
  },
  sessionsCardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 100, // Constant size
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 16,
  },
  sessionsContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 8,
  },
  sessionStatSkeleton: {
    flex: 1,
    alignItems: 'center',
  },
  sessionLabelSkeleton: {
    width: '60%',
    height: 15,
    borderRadius: 6,
    marginBottom: 8,
  },
  sessionValueSkeleton: {
    width: '40%',
    height: 24,
    borderRadius: 6,
  },
});

