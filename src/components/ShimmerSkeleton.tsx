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
      <View style={[styles.base, { borderRadius }]} />

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

export const ShimmerActivityHistory: React.FC<ShimmerCardProps> = ({ style }) => {
  return (
    <View style={[{ gap: 12 }, style]}>
      {[...Array(4)].map((_, i) => (
        <View key={i} style={styles.activityItemContainer}>
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
  return (
    <View style={[{ gap: 12 }, style]}>
      {[...Array(4)].map((_, i) => (
        <View key={i} style={styles.feedbackItemContainer}>
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

export const ShimmerMeditationDetailMedia: React.FC<ShimmerCardProps> = ({ style }) => {
  return (
    <View style={[styles.meditationDetailMediaContainer, style]}>
      <ShimmerSkeleton width={60} height={60} borderRadius={30} style={styles.meditationDetailMediaIcon} />
      <ShimmerSkeleton width={32} height={32} borderRadius={16} style={styles.meditationDetailMediaPlayButton} />
    </View>
  );
};

export const ShimmerMeditationDetailContent: React.FC<ShimmerCardProps> = ({ style }) => {
  return (
    <View style={[styles.meditationDetailContentContainer, style]}>
      {/* Title */}
      <ShimmerSkeleton width="80%" height={21} borderRadius={6} style={styles.meditationDetailTitleSkeleton} />

      {/* Tags */}
      <View style={styles.meditationDetailTagsContainer}>
        <ShimmerSkeleton width={80} height={28} borderRadius={12} style={styles.meditationDetailTagSkeleton} />
        <ShimmerSkeleton width={100} height={28} borderRadius={12} style={styles.meditationDetailTagSkeleton} />
        <ShimmerSkeleton width={70} height={28} borderRadius={12} style={styles.meditationDetailTagSkeleton} />
      </View>

      {/* Description Section */}
      <View style={{ paddingHorizontal: 0, paddingTop: 0, paddingBottom: 20 }}>
        <ShimmerSkeleton width="40%" height={20} borderRadius={6} style={styles.meditationDetailDescriptionTitleSkeleton} />
        <ShimmerSkeleton width="100%" height={16} borderRadius={6} style={styles.meditationDetailDescriptionTextSkeleton} />
        <ShimmerSkeleton width="95%" height={16} borderRadius={6} style={styles.meditationDetailDescriptionTextSkeleton} />
        <ShimmerSkeleton width="90%" height={16} borderRadius={6} style={styles.meditationDetailDescriptionTextSkeleton} />
        <ShimmerSkeleton width="85%" height={16} borderRadius={6} style={styles.meditationDetailDescriptionTextSkeleton} />
      </View>

      {/* Benefits Section */}
      <View style={{ paddingHorizontal: 0, paddingTop: 0, paddingBottom: 24 }}>
        <ShimmerSkeleton width="50%" height={20} borderRadius={6} style={styles.meditationDetailBenefitsTitleSkeleton} />
        <ShimmerSkeleton width="100%" height={15} borderRadius={6} style={styles.meditationDetailBenefitsTextSkeleton} />
        <ShimmerSkeleton width="98%" height={15} borderRadius={6} style={styles.meditationDetailBenefitsTextSkeleton} />
        <ShimmerSkeleton width="95%" height={15} borderRadius={6} style={styles.meditationDetailBenefitsTextSkeleton} />
        <ShimmerSkeleton width="92%" height={15} borderRadius={6} style={styles.meditationDetailBenefitsTextSkeleton} />

        {/* Unique Benefits */}
        <ShimmerSkeleton width="45%" height={17} borderRadius={6} style={styles.meditationDetailUniqueBenefitsTitleSkeleton} />
        {[...Array(3)].map((_, i) => (
          <View key={i} style={styles.meditationDetailBenefitItemSkeleton}>
            <ShimmerSkeleton width={18} height={18} borderRadius={9} style={styles.meditationDetailBenefitIconSkeleton} />
            <ShimmerSkeleton width="100%" height={15} borderRadius={6} style={styles.meditationDetailBenefitTextSkeleton} />
          </View>
        ))}
      </View>
    </View>
  );
};

export const ShimmerNeuroadaptationCard: React.FC<ShimmerCardProps> = ({ style }) => {
  return (
    <View style={[styles.neuroadaptationCardContainer, style]}>
      {/* Header */}
      <View style={styles.neuroadaptationCardHeader}>
        <View style={styles.neuroadaptationCardTitleRow}>
          <ShimmerSkeleton width="100%" height={18} borderRadius={6} style={styles.neuroadaptationCardTitleSkeleton} />
        </View>
        <ShimmerSkeleton width="50%" height={14} borderRadius={6} style={styles.neuroadaptationCardTimeRangeSkeleton} />
      </View>

      {/* Progress Bar */}
      <View style={styles.neuroadaptationProgressBarContainer}>
        <ShimmerSkeleton width="100%" height={8} borderRadius={4} style={styles.neuroadaptationProgressBarTrack} />
        <ShimmerSkeleton width={40} height={14} borderRadius={6} style={styles.neuroadaptationProgressPercentageSkeleton} />
      </View>

      {/* Description */}
      <View style={{ marginBottom: 12 }}>
        <ShimmerSkeleton width="100%" height={15} borderRadius={6} style={styles.neuroadaptationCardDescriptionSkeleton} />
        <ShimmerSkeleton width="95%" height={15} borderRadius={6} style={styles.neuroadaptationCardDescriptionSkeleton} />
        <ShimmerSkeleton width="90%" height={15} borderRadius={6} style={styles.neuroadaptationCardDescriptionSkeleton} />
      </View>

      {/* What You Feel or Sessions Required */}
      <View style={styles.neuroadaptationWhatYouFeelContainer}>
        <ShimmerSkeleton width="40%" height={13} borderRadius={6} style={styles.neuroadaptationWhatYouFeelLabelSkeleton} />
        <ShimmerSkeleton width="100%" height={14} borderRadius={6} style={styles.neuroadaptationWhatYouFeelTextSkeleton} />
        <ShimmerSkeleton width="95%" height={14} borderRadius={6} style={styles.neuroadaptationWhatYouFeelTextSkeleton} />
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
    backgroundColor: '#1A1A24',
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    width: '100%',
    shadowColor: 'rgba(255, 255, 255, 0.08)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12121A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    backgroundColor: '#12121A',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
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
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#1A1A24',
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
    backgroundColor: '#2A2A36',
    marginHorizontal: 12,
    borderRadius: 0.5,
  },
  progressPathTimelineSection: {
    marginTop: 16,
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
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
    backgroundColor: '#12121A',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
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
    backgroundColor: '#12121A',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    backgroundColor: '#1A1A24',
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
    backgroundColor: '#1A1A24',
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
  meditationDetailMediaContainer: {
    height: 200,
    width: '100%',
    backgroundColor: '#1A1A24',
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  meditationDetailMediaIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  meditationDetailMediaPlayButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  meditationDetailContentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  meditationDetailTitleSkeleton: {
    width: '80%',
    height: 21,
    borderRadius: 6,
    marginBottom: 12,
  },
  meditationDetailTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  meditationDetailTagSkeleton: {
    width: 80,
    height: 28,
    borderRadius: 12,
  },
  meditationDetailDescriptionTitleSkeleton: {
    width: '40%',
    height: 20,
    borderRadius: 6,
    marginBottom: 8,
    marginTop: 0,
  },
  meditationDetailDescriptionTextSkeleton: {
    width: '100%',
    height: 16,
    borderRadius: 6,
    marginBottom: 6,
  },
  meditationDetailBenefitsTitleSkeleton: {
    width: '50%',
    height: 20,
    borderRadius: 6,
    marginBottom: 8,
    marginTop: 0,
  },
  meditationDetailBenefitsTextSkeleton: {
    width: '100%',
    height: 15,
    borderRadius: 6,
    marginBottom: 6,
  },
  meditationDetailUniqueBenefitsTitleSkeleton: {
    width: '45%',
    height: 17,
    borderRadius: 6,
    marginBottom: 12,
    marginTop: 20,
  },
  meditationDetailBenefitItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12121A',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  meditationDetailBenefitIconSkeleton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 10,
  },
  meditationDetailBenefitTextSkeleton: {
    flex: 1,
    height: 15,
    borderRadius: 6,
  },
  neuroadaptationCardContainer: {
    backgroundColor: '#12121A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: '#2A2A36',
  },
  neuroadaptationCardHeader: {
    marginBottom: 12,
  },
  neuroadaptationCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  neuroadaptationCardTitleSkeleton: {
    flex: 1,
    height: 18,
    borderRadius: 6,
    marginRight: 8,
  },
  neuroadaptationCardCheckmarkSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  neuroadaptationCardTimeRangeSkeleton: {
    width: '50%',
    height: 14,
    borderRadius: 6,
  },
  neuroadaptationProgressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  neuroadaptationProgressBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  neuroadaptationProgressPercentageSkeleton: {
    width: 40,
    height: 14,
    borderRadius: 6,
  },
  neuroadaptationCardDescriptionSkeleton: {
    width: '100%',
    height: 15,
    borderRadius: 6,
    marginBottom: 4,
  },
  neuroadaptationWhatYouFeelContainer: {
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    backgroundColor: '#1A1A24',
    marginTop: 12,
  },
  neuroadaptationWhatYouFeelLabelSkeleton: {
    width: '40%',
    height: 13,
    borderRadius: 6,
    marginBottom: 6,
  },
  neuroadaptationWhatYouFeelTextSkeleton: {
    width: '100%',
    height: 14,
    borderRadius: 6,
    marginBottom: 4,
  },
  neuroadaptationSessionsRequiredSkeleton: {
    width: '60%',
    height: 14,
    borderRadius: 6,
    marginTop: 12,
  },
});
