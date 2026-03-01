import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

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
  const theme = useTheme();
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

  // Subtle sweep with smooth fade in/out
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
      {/* Dark base */}
      <View
        style={[
          styles.base,
          {
            borderRadius,
            backgroundColor: theme.colors.surfaceElevated,
          },
        ]}
      />

      {/* Shimmer overlay - subtle light sweep */}
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerTranslateX }],
            opacity: shimmerOpacity,
          },
        ]}
      >
        <View
          style={[
            styles.shimmerInner,
            {
              backgroundColor: theme.isDark
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(0, 0, 0, 0.04)',
              shadowColor: theme.isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.04)',
            },
          ]}
        />
      </Animated.View>
    </View>
  );
};

type ShimmerCardProps = {
  style?: ViewStyle;
};

export const ShimmerSessionCard: React.FC<ShimmerCardProps> = ({ style }) => {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
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
  const theme = useTheme();
  return (
    <View
      style={[
        styles.alternativeCardContainer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
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
  const theme = useTheme();
  return (
    <View
      style={[
        styles.calendarCardContainer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
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
      <View
        style={[
          styles.calendarLegend,
          { borderTopColor: theme.colors.border },
        ]}
      >
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
  const theme = useTheme();
  return (
    <View
      style={[
        styles.sessionsCardContainer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
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

export const ShimmerActivityHistory: React.FC<ShimmerCardProps> = ({ style }) => {
  const theme = useTheme();
  return (
    <View style={[{ gap: 12 }, style]}>
      {[...Array(4)].map((_, i) => (
        <View
          key={i}
          style={[
            styles.activityItemContainer,
            { backgroundColor: theme.colors.surfaceElevated },
          ]}
        >
          <ShimmerSkeleton width={40} height={40} borderRadius={20} style={styles.activityIconSkeleton} />
          <View style={styles.activityInfoSkeleton}>
            <ShimmerSkeleton width="70%" height={15} borderRadius={6} style={styles.activityTitleSkeleton} />
            <ShimmerSkeleton width="50%" height={13} borderRadius={6} style={styles.activityDateSkeleton} />
            <ShimmerSkeleton width="40%" height={13} borderRadius={6} style={styles.activityMetaSkeleton} />
          </View>
          <ShimmerSkeleton width={50} height={28} borderRadius={8} style={styles.activityDurationBadgeSkeleton} />
        </View>
      ))}
    </View>
  );
};

export const ShimmerEmotionalFeedbackHistory: React.FC<ShimmerCardProps> = ({ style }) => {
  const theme = useTheme();
  return (
    <View style={[{ gap: 12 }, style]}>
      {[...Array(4)].map((_, i) => (
        <View
          key={i}
          style={[
            styles.feedbackItemContainer,
            { backgroundColor: theme.colors.surfaceElevated },
          ]}
        >
          <ShimmerSkeleton width={40} height={40} borderRadius={20} style={styles.feedbackIconSkeleton} />
          <View style={styles.feedbackInfoSkeleton}>
            <ShimmerSkeleton width="65%" height={15} borderRadius={6} style={styles.feedbackTitleSkeleton} />
            <ShimmerSkeleton width="45%" height={13} borderRadius={6} style={styles.feedbackDateSkeleton} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ShimmerSkeleton width={60} height={20} borderRadius={8} style={styles.feedbackTagSkeleton} />
              <ShimmerSkeleton width="35%" height={13} borderRadius={6} style={styles.feedbackTimestampSkeleton} />
            </View>
          </View>
          <ShimmerSkeleton width={24} height={24} borderRadius={12} style={styles.feedbackDeleteButtonSkeleton} />
        </View>
      ))}
    </View>
  );
};

export const ShimmerMeditationDetailHero: React.FC<ShimmerCardProps> = ({ style }) => {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.meditationDetailHeroContainer,
        { backgroundColor: theme.colors.surfaceElevated },
        style,
      ]}
    >
      {/* Large centered emoji placeholder */}
      <ShimmerSkeleton width={64} height={64} borderRadius={32} style={styles.meditationDetailHeroEmoji} />
      {/* Modality label placeholder */}
      <ShimmerSkeleton width={80} height={15} borderRadius={6} style={styles.meditationDetailHeroLabel} />
      {/* Duration badge - bottom right */}
      <View style={styles.meditationDetailHeroDurationBadge}>
        <ShimmerSkeleton width={60} height={28} borderRadius={14} />
      </View>
    </View>
  );
};

export const ShimmerMeditationDetailContent: React.FC<ShimmerCardProps> = ({ style }) => {
  const theme = useTheme();
  return (
    <View style={[styles.meditationDetailContentContainer, style]}>
      {/* Handle indicator */}
      <View style={styles.meditationDetailHandle}>
        <ShimmerSkeleton width={36} height={4} borderRadius={2} />
      </View>

      {/* Title row with like button */}
      <View style={styles.meditationDetailTitleRow}>
        <ShimmerSkeleton width="65%" height={26} borderRadius={6} />
        <ShimmerSkeleton width={28} height={28} borderRadius={14} />
      </View>

      {/* Metadata grid - 2x2 */}
      <View style={styles.meditationDetailMetadataGrid}>
        {[...Array(4)].map((_, i) => (
          <View key={i} style={styles.meditationDetailMetaItem}>
            <ShimmerSkeleton width={14} height={14} borderRadius={7} />
            <ShimmerSkeleton width={60} height={13} borderRadius={6} style={{ marginLeft: 6 }} />
          </View>
        ))}
      </View>

      {/* Description section */}
      <View style={styles.meditationDetailDescriptionSection}>
        <ShimmerSkeleton width="35%" height={17} borderRadius={6} style={{ marginBottom: 8 }} />
        <ShimmerSkeleton width="100%" height={15} borderRadius={6} style={{ marginBottom: 6 }} />
        <ShimmerSkeleton width="95%" height={15} borderRadius={6} style={{ marginBottom: 6 }} />
        <ShimmerSkeleton width="80%" height={15} borderRadius={6} />
      </View>

      {/* Tab bar */}
      <View style={[styles.meditationDetailTabBar, { borderBottomColor: theme.colors.border }]}>
        {[...Array(3)].map((_, i) => (
          <View key={i} style={styles.meditationDetailTabItem}>
            <ShimmerSkeleton width="55%" height={15} borderRadius={6} />
          </View>
        ))}
      </View>

      {/* Tab content - summary placeholder */}
      <View style={styles.meditationDetailTabContent}>
        {/* Also helps with section */}
        <View style={styles.meditationDetailAlsoHelpsSection}>
          <ShimmerSkeleton width="35%" height={15} borderRadius={6} style={{ marginBottom: 10 }} />
          <View style={styles.meditationDetailModuleTags}>
            <ShimmerSkeleton width={90} height={34} borderRadius={20} />
            <ShimmerSkeleton width={110} height={34} borderRadius={20} />
            <ShimmerSkeleton width={80} height={34} borderRadius={20} />
          </View>
        </View>

        {/* Why it works card */}
        <View
          style={[
            styles.meditationDetailScienceCard,
            {
              backgroundColor: theme.colors.surface,
              borderLeftColor: theme.colors.border,
            },
            !theme.isDark && { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
            theme.isDark && { borderWidth: 1, borderColor: theme.colors.border, borderLeftWidth: 3 },
          ]}
        >
          <ShimmerSkeleton width="30%" height={12} borderRadius={6} style={{ marginBottom: 8 }} />
          <ShimmerSkeleton width="100%" height={15} borderRadius={6} style={{ marginBottom: 6 }} />
          <ShimmerSkeleton width="95%" height={15} borderRadius={6} style={{ marginBottom: 6 }} />
          <ShimmerSkeleton width="90%" height={15} borderRadius={6} />
        </View>
      </View>
    </View>
  );
};

export const ShimmerNeuroadaptationCard: React.FC<ShimmerCardProps> = ({ style }) => {
  const theme = useTheme();
  return (
    <View style={[styles.neuroadaptationRow, style]}>
      {/* Left: Node + Connector */}
      <View style={styles.neuroadaptationLeftColumn}>
        <ShimmerSkeleton width={24} height={24} borderRadius={12} />
        <View style={[styles.neuroadaptationConnector, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
      </View>

      {/* Right: Content */}
      <View style={styles.neuroadaptationContent}>
        {/* Header row: title + chevron */}
        <View style={styles.neuroadaptationHeader}>
          <ShimmerSkeleton width="65%" height={16} borderRadius={6} />
          <View style={styles.neuroadaptationHeaderRight}>
            <ShimmerSkeleton width={40} height={22} borderRadius={10} />
            <ShimmerSkeleton width={22} height={22} borderRadius={11} />
          </View>
        </View>

        {/* Time range */}
        <ShimmerSkeleton width="40%" height={13} borderRadius={6} style={{ marginTop: 3 }} />

        {/* Progress bar */}
        <View style={styles.neuroadaptationProgressWrap}>
          <ShimmerSkeleton width="100%" height={4} borderRadius={2} />
        </View>

        {/* Description */}
        <View style={{ marginTop: 10 }}>
          <ShimmerSkeleton width="100%" height={14} borderRadius={6} style={{ marginBottom: 4 }} />
          <ShimmerSkeleton width="95%" height={14} borderRadius={6} style={{ marginBottom: 4 }} />
          <ShimmerSkeleton width="85%" height={14} borderRadius={6} />
        </View>

        {/* Feel box */}
        <View
          style={[
            styles.neuroadaptationFeelBox,
            {
              backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          <ShimmerSkeleton width="35%" height={12} borderRadius={6} style={{ marginBottom: 4 }} />
          <ShimmerSkeleton width="100%" height={13} borderRadius={6} style={{ marginBottom: 4 }} />
          <ShimmerSkeleton width="90%" height={13} borderRadius={6} />
        </View>
      </View>
    </View>
  );
};

export const ShimmerProgressPathCard: React.FC<ShimmerCardProps> = ({ style }) => {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.progressPathCardContainer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {/* Header */}
      <View style={styles.progressPathHeader}>
        {/* Badge skeleton - rounded square like actual */}
        <ShimmerSkeleton width={40} height={40} borderRadius={12} style={styles.progressPathBadgeSkeleton} />

        {/* Title and subtitle */}
        <View style={styles.progressPathHeaderText}>
          <ShimmerSkeleton width="60%" height={17} borderRadius={6} style={styles.progressPathTitleSkeleton} />
          <ShimmerSkeleton width="80%" height={14} borderRadius={6} style={styles.progressPathSubtitleSkeleton} />
        </View>
      </View>

      {/* Timeline section - no border, just background */}
      <View
        style={[
          styles.progressPathTimeline,
          {
            backgroundColor: theme.isDark ? theme.colors.surfaceElevated : 'rgba(0,0,0,0.03)',
          },
        ]}
      >
        {/* Left column - Completed */}
        <View style={styles.progressPathColumn}>
          <ShimmerSkeleton width="50%" height={11} borderRadius={4} style={styles.progressPathSectionLabelSkeleton} />
          {/* Completed items */}
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
        </View>

        {/* Divider */}
        <View
          style={[
            styles.progressPathDivider,
            { backgroundColor: theme.colors.borderMedium || theme.colors.disabled },
          ]}
        />

        {/* Right column - Coming Up */}
        <View style={styles.progressPathColumn}>
          <ShimmerSkeleton width="50%" height={11} borderRadius={4} style={styles.progressPathSectionLabelSkeleton} />
          <View style={styles.progressPathLockedRow}>
            <ShimmerSkeleton width={36} height={36} borderRadius={18} />
            <View style={styles.progressPathItemText}>
              <ShimmerSkeleton width="70%" height={12} borderRadius={6} style={styles.progressPathItemTitle} />
              <ShimmerSkeleton width="55%" height={12} borderRadius={6} style={{ marginTop: 4 }} />
            </View>
          </View>
        </View>
      </View>

      {/* Timeline Progress Section */}
      <View
        style={[
          styles.progressPathTimelineSection,
          { borderTopColor: theme.colors.borderMedium || theme.colors.border },
        ]}
      >
        {/* Header */}
        <View style={styles.progressPathTimelineHeader}>
          <ShimmerSkeleton width="55%" height={13} borderRadius={6} />
          <ShimmerSkeleton width="15%" height={13} borderRadius={6} />
        </View>

        {/* Progress bar */}
        <ShimmerSkeleton width="100%" height={4} borderRadius={2} style={styles.progressPathBarSkeleton} />

        {/* Progress text */}
        <ShimmerSkeleton width="70%" height={12} borderRadius={6} style={styles.progressPathTextSkeleton} />
      </View>

      {/* Footer - background bar style */}
      <View
        style={[
          styles.progressPathFooter,
          { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
        ]}
      >
        <ShimmerSkeleton width="60%" height={14} borderRadius={6} />
        <ShimmerSkeleton width={15} height={22} borderRadius={4} />
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
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 200,
    left: '50%',
    marginLeft: -100,
  },
  shimmerInner: {
    flex: 1,
    width: '100%',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    minHeight: 104,
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
    borderWidth: 1,
    minHeight: 64,
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
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
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
    borderRadius: 10,
    borderWidth: 0,
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
    width: 0.5,
    marginHorizontal: 12,
    borderRadius: 0.5,
  },
  progressPathTimelineSection: {
    marginTop: 16,
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 0.5,
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
  progressPathLockedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  progressPathFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  calendarCardContainer: {
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 450,
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
    height: 280,
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
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 100,
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
  activityItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
  },
  activityIconSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  activityInfoSkeleton: {
    flex: 1,
    paddingRight: 8,
  },
  activityTitleSkeleton: {
    width: '70%',
    height: 15,
    borderRadius: 6,
    marginBottom: 6,
  },
  activityDateSkeleton: {
    width: '50%',
    height: 13,
    borderRadius: 6,
    marginBottom: 4,
  },
  activityMetaSkeleton: {
    width: '40%',
    height: 13,
    borderRadius: 6,
  },
  activityDurationBadgeSkeleton: {
    width: 50,
    height: 28,
    borderRadius: 8,
    marginLeft: 12,
  },
  feedbackItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
  },
  feedbackIconSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  feedbackInfoSkeleton: {
    flex: 1,
    paddingRight: 8,
  },
  feedbackTitleSkeleton: {
    width: '65%',
    height: 15,
    borderRadius: 6,
    marginBottom: 6,
  },
  feedbackDateSkeleton: {
    width: '45%',
    height: 13,
    borderRadius: 6,
    marginBottom: 4,
  },
  feedbackTagSkeleton: {
    width: 60,
    height: 20,
    borderRadius: 8,
    marginRight: 8,
  },
  feedbackTimestampSkeleton: {
    width: '35%',
    height: 13,
    borderRadius: 6,
  },
  feedbackDeleteButtonSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: 8,
  },
  meditationDetailHeroContainer: {
    height: 280,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  meditationDetailHeroEmoji: {
    marginTop: 60,
  },
  meditationDetailHeroLabel: {
    marginTop: 8,
  },
  meditationDetailHeroDurationBadge: {
    position: 'absolute',
    bottom: 14,
    right: 16,
  },
  meditationDetailContentContainer: {
    paddingTop: 0,
  },
  meditationDetailHandle: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  meditationDetailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  meditationDetailMetadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginTop: 14,
    rowGap: 12,
  },
  meditationDetailMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
  },
  meditationDetailDescriptionSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  meditationDetailTabBar: {
    flexDirection: 'row',
    marginTop: 24,
    borderBottomWidth: 1,
  },
  meditationDetailTabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  meditationDetailTabContent: {
    paddingTop: 16,
  },
  meditationDetailAlsoHelpsSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  meditationDetailModuleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  meditationDetailScienceCard: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 14,
    borderLeftWidth: 3,
    padding: 16,
  },
  neuroadaptationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  neuroadaptationLeftColumn: {
    width: 32,
    alignItems: 'center',
    marginRight: 16,
  },
  neuroadaptationConnector: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginVertical: 4,
  },
  neuroadaptationContent: {
    flex: 1,
    paddingBottom: 28,
  },
  neuroadaptationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  neuroadaptationHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  neuroadaptationProgressWrap: {
    marginTop: 10,
    marginBottom: 2,
  },
  neuroadaptationFeelBox: {
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
  },
});
