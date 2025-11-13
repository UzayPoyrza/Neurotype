import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Dimensions, LayoutChangeEvent } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Session } from '../types';
import { MentalHealthModule } from '../data/modules';
import { mockSessions } from '../data/mockData';
import { useStore } from '../store/useStore';

interface CompletedMeditation {
  id: string;
  session: Session;
  completedDate: Date;
}

interface ModuleRoadmapProps {
  module: MentalHealthModule;
  todayCompleted?: boolean;
  triggerUnlockAnimation?: boolean;
  onUnlockComplete?: () => void;
  onSessionSelect?: (session: Session) => void;
  onBackPress?: () => void;
}

export const ModuleRoadmap: React.FC<ModuleRoadmapProps> = ({
  module,
  todayCompleted = false,
  triggerUnlockAnimation = false,
  onUnlockComplete,
  onSessionSelect,
  onBackPress,
}) => {
  const navigation = useNavigation();
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  const roadmapData = useMemo(() => {
    const relevantGoals = {
      anxiety: ['anxiety'],
      adhd: ['focus'],
      depression: ['sleep', 'focus'],
      bipolar: ['anxiety', 'sleep'],
      panic: ['anxiety'],
      ptsd: ['anxiety', 'sleep'],
      stress: ['anxiety', 'focus'],
      sleep: ['sleep'],
      focus: ['focus'],
      'emotional-regulation': ['anxiety', 'focus'],
      mindfulness: ['focus', 'sleep'],
      'self-compassion': ['sleep', 'focus'],
    };

    const goals = relevantGoals[module.id as keyof typeof relevantGoals] || ['focus'];
    const moduleSessions = mockSessions.filter(session => goals.includes(session.goal));

    const completedCount = Math.min(6, Math.max(2, moduleSessions.length > 3 ? moduleSessions.length - 4 : 3));
    const todayCount = Math.min(3, Math.max(1, moduleSessions.length - completedCount));

    const completedSessions: CompletedMeditation[] = [];
    for (let i = 0; i < completedCount && i < moduleSessions.length; i++) {
      const session = moduleSessions[i];
      const completedDate = new Date();
      completedDate.setDate(completedDate.getDate() - (completedCount - i));

      completedSessions.push({
        id: `${module.id}-completed-${session.id}-${i}`,
        session: {
          ...session,
          id: `${session.id}-completed-${i}`,
        },
        completedDate,
      });
    }

    const todaySessions = moduleSessions
      .slice(completedCount, completedCount + todayCount)
      .map((session, idx) => ({
        ...session,
        id: `${session.id}-today-${idx}`,
      }));

    const tomorrowCandidate = moduleSessions[completedCount + todayCount];

    return {
      completedSessions,
      todaySessions,
      tomorrowSession: tomorrowCandidate
        ? {
            ...tomorrowCandidate,
            id: `${tomorrowCandidate.id}-tomorrow`,
          }
        : undefined,
    };
  }, [module]);

  const { completedSessions, todaySessions, tomorrowSession } = roadmapData;
  const todayRecommendedSessionId = todaySessions[0]?.id;
  
  const titleText = `${module.title} Journey`;
  // Use smaller font for longer titles
  // <= 20 chars: 30px, 21-24 chars: 26px, > 24 chars: 22px
  const titleFontSize = titleText.length > 24 ? 22 : titleText.length > 20 ? 26 : 30;


  useEffect(() => {
    // Pulse animation for today's node
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ]).start(() => pulse());
    };
    
    pulse();
  }, [pulseAnim]);

  useEffect(() => {
    // Glow animation for available nodes
    const glow = () => {
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: false,
        }),
      ]).start(() => glow());
    };
    
    glow();
  }, [glowAnim]);

  const completedSectionY = useRef(0);
  const todaySectionY = useRef(0);
  const tomorrowSectionY = useRef(0);


  useEffect(() => {
    if (!scrollViewRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      const screenHeight = Dimensions.get('window').height;
      const targetOffset = Math.max(0, todaySectionY.current - screenHeight * 0.2);

      scrollViewRef.current?.scrollTo({ y: targetOffset, animated: true });
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const handleJumpTo = (position: 'completed' | 'today' | 'tomorrow') => {
    const target =
      position === 'completed'
        ? completedSectionY.current
        : position === 'today'
          ? todaySectionY.current
          : tomorrowSectionY.current;

    if (!scrollViewRef.current) {
      return;
    }

    // Account for header height when scrolling
    scrollViewRef.current.scrollTo({
      y: Math.max(0, target - 180), // Header height
      animated: true,
    });
  };

  const renderCompletedMeditations = () => {
    if (!completedSessions.length) {
      return null;
    }

    const formatDate = (date: Date) => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      }
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
      <View
        style={[styles.section, styles.sectionFirst]}
        onLayout={event => {
          completedSectionY.current = event.nativeEvent.layout.y;
        }}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Progress</Text>
          <Text style={styles.sectionSubtitle}>
            {completedSessions.length} completed {completedSessions.length === 1 ? 'session' : 'sessions'}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.completedScrollContent}
          bounces={false}
        >
          {completedSessions.map(item => (
            <View key={item.id} style={styles.completedCard}>
              <Text style={styles.completedTitle} numberOfLines={2}>
                {item.session.title}
              </Text>
              <Text style={styles.completedMeta}>
                {item.session.durationMin} min • {item.session.modality}
              </Text>
              <Text style={styles.completedDate}>{formatDate(item.completedDate)}</Text>
              <View style={[styles.completedBadge, { backgroundColor: module.color }]}>
                <Text style={styles.completedBadgeIcon}>✓</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderTodayPlan = () => {
    return (
      <View
        style={styles.section}
        onLayout={event => {
          todaySectionY.current = event.nativeEvent.layout.y;
        }}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Plan</Text>
          <Text style={styles.sectionSubtitle}>
            {todayCompleted ? 'You finished today\'s check-in 🎉' : 'Choose the meditation that feels right now'}
          </Text>
        </View>
        <View style={styles.todayList}>
          {todaySessions.map(session => {
            const isRecommended = session.id === todayRecommendedSessionId;
            const scale = pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.04],
            });
            const shadowOpacity = pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.12, 0.3],
            });

            return (
              <Animated.View
                key={session.id}
                style={[
                  styles.todayCardWrapper,
                  isRecommended && {
                    transform: [{ scale }],
                    shadowOpacity,
                    shadowColor: module.color,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => onSessionSelect?.(session)}
                  activeOpacity={0.85}
                  style={[
                    styles.todayCard,
                    isRecommended && { borderColor: module.color, backgroundColor: '#F7F9FF' },
                  ]}
                >
                  <View style={styles.todayCardHeader}>
                    <View style={[styles.todayCardBadge, { backgroundColor: module.color }]}>
                      <Text style={styles.todayCardBadgeText}>{isRecommended ? 'Start here' : 'Next'}</Text>
                    </View>
                    <Text style={styles.todayCardDuration}>
                      {session.durationMin} min • {session.modality}
                    </Text>
                  </View>
                  <Text
                    style={[styles.todayCardTitle, isRecommended && { color: module.color }]}
                    numberOfLines={2}
                  >
                    {session.title}
                  </Text>
                  <View style={styles.todayCardFooter}>
                    <Text style={styles.todayCardCTA}>{todayCompleted ? 'Replay session' : 'Begin session'}</Text>
                    <View style={[styles.todayPlayButton, { backgroundColor: module.color }]}>
                      <Text style={styles.todayPlayIcon}>▶</Text>
                    </View>
                  </View>
                  {isRecommended && (
                    <Text style={[styles.recommendedCopy, { color: module.color }]}>
                      Recommended to keep your streak alive
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTomorrowPreview = () => {
    if (!tomorrowSession) {
      return null;
    }

    // Locked version when today is not completed
    if (!todayCompleted) {
      return (
        <View
          style={styles.section}
          onLayout={event => {
            tomorrowSectionY.current = event.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tomorrow</Text>
            <Text style={styles.sectionSubtitle}>Finish today's meditation to unlock</Text>
          </View>
          <View style={[styles.tomorrowCard, styles.tomorrowCardLocked]}>
            <View style={styles.tomorrowHeader}>
              <View style={[styles.tomorrowIcon, styles.tomorrowIconLocked, { backgroundColor: '#D1D1D6' }]}>
                <Text style={styles.tomorrowIconText}>🔒</Text>
              </View>
              <View style={styles.tomorrowLockedContent}>
                <Text style={styles.tomorrowLockedTitle}>Locked</Text>
                <Text style={styles.tomorrowLockedDescription}>
                  Complete today's sessions to see what's coming next
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    // Preview version when today is completed
    const glow = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.85, 1],
    });

    return (
      <Animated.View
        style={[
          styles.section,
          {
            opacity: glow,
          },
        ]}
        onLayout={event => {
          tomorrowSectionY.current = event.nativeEvent.layout.y;
        }}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tomorrow</Text>
          <Text style={styles.sectionSubtitle}>Preview of what's coming next</Text>
        </View>
        <View style={styles.tomorrowCard}>
          <View style={styles.tomorrowHeader}>
            <View style={[styles.tomorrowIcon, { backgroundColor: module.color }]}>
              <Text style={styles.tomorrowIconText}>➡︎</Text>
            </View>
            <View>
              <Text style={styles.tomorrowLabel}>Up next</Text>
              <Text style={styles.tomorrowTitle} numberOfLines={1}>
                {tomorrowSession.title}
              </Text>
            </View>
          </View>
          <Text style={styles.tomorrowMeta}>
            {tomorrowSession.durationMin} min • {tomorrowSession.modality}
          </Text>
          <Text style={styles.tomorrowDescription}>
            Keep momentum going tomorrow to stay aligned with your {module.title} path.
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderQuickJump = () => {
    const destinations: Array<{ key: 'completed' | 'today' | 'tomorrow'; label: string; disabled?: boolean }> = [
      { key: 'completed', label: 'Progress', disabled: !completedSessions.length },
      { key: 'today', label: 'Today' },
      { key: 'tomorrow', label: 'Tomorrow', disabled: !todayCompleted || !tomorrowSession },
    ];

    return (
      <View style={styles.quickJumpRow}>
        {destinations.map(item => (
          <TouchableOpacity
            key={item.key}
            onPress={() => !item.disabled && handleJumpTo(item.key)}
            activeOpacity={item.disabled ? 1 : 0.85}
            style={[
              styles.quickJumpChip,
              item.key === 'today' && styles.quickJumpChipActive,
              item.key === 'today' && { backgroundColor: module.color },
              item.disabled && styles.quickJumpChipDisabled,
            ]}
          >
            <Text
              style={[
                styles.quickJumpChipText,
                item.key === 'today' && { color: '#FFFFFF' },
                item.disabled && styles.quickJumpChipTextDisabled,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Layout handlers
  const handleScrollViewLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setScrollViewHeight(height);
  }, []);

  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setContentHeight(height);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
      {/* Sticky Header */}
      <View style={styles.headerContainer}>
        <View style={styles.topShell}>
          <View style={styles.topShellContent}>
            <TouchableOpacity
              onPress={onBackPress || (() => navigation.goBack())}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text 
                style={[styles.headerTitle, { fontSize: titleFontSize, lineHeight: titleFontSize * 1.2 }]} 
                numberOfLines={1}
              >
                {titleText}
              </Text>
            </View>
          </View>
          <View style={styles.quickJumpContainer}>
            {renderQuickJump()}
          </View>
          <View style={styles.topShellBorder} />
        </View>
      </View>

      {/* ScrollView with content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.bodyScroll}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        onLayout={handleScrollViewLayout}
        onContentSizeChange={(width, height) => {
          setContentHeight(height);
        }}
      >
        <View style={styles.contentWrapper} onLayout={handleContentLayout}>
          <View style={[styles.summaryCard, { borderColor: module.color }]}>
            <Text style={styles.summaryTitle}>Module Progress</Text>
            <View style={styles.summaryStatsRow}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{completedSessions.length}</Text>
                <Text style={styles.summaryStatLabel}>Completed</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{todaySessions.length}</Text>
                <Text style={styles.summaryStatLabel}>Today</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{tomorrowSession ? 1 : 0}</Text>
                <Text style={styles.summaryStatLabel}>Queued</Text>
              </View>
            </View>
          </View>
          {renderCompletedMeditations()}
          {renderTodayPlan()}
          {renderTomorrowPreview()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  topShell: {
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1001,
  },
  topShellContent: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 14,
  },
  quickJumpContainer: {
    paddingHorizontal: 24,
    paddingBottom: 14,
  },
  topShellBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#ECECEC',
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    fontFamily: 'System',
  },
  headerTitleContainer: {
    flexShrink: 1,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'System',
    marginTop: 0,
    lineHeight: 36,
    marginBottom: 0,
  },
  quickJumpRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  quickJumpChip: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  quickJumpChipActive: {
    borderColor: 'transparent',
  },
  quickJumpChipDisabled: {
    backgroundColor: '#F2F2F7',
  },
  quickJumpChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    fontFamily: 'System',
  },
  quickJumpChipTextDisabled: {
    color: '#AEAEB2',
  },
  bodyScroll: {
    flex: 1,
    paddingTop: 180, // TopShell height
  },
  bodyContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 96,
  },
  contentWrapper: {
    flexDirection: 'column',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1D1F',
    fontFamily: 'System',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
    fontFamily: 'System',
  },
  summaryStatLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'System',
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E5EA',
  },
  section: {
    width: '100%',
    marginTop: 20,
  },
  sectionFirst: {
    marginTop: 12,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    fontFamily: 'System',
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'System',
  },
  completedScrollContent: {
    paddingRight: 12,
    gap: 12,
  },
  completedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    width: 160,
    height: 120,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'space-between',
    position: 'relative',
  },
  completedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  completedBadgeIcon: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  completedTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    lineHeight: 19,
    marginBottom: 2,
    fontFamily: 'System',
  },
  completedMeta: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
    fontFamily: 'System',
  },
  completedDate: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
    fontFamily: 'System',
  },
  todayList: {
    gap: 10,
  },
  todayCardWrapper: {
    borderRadius: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    shadowOpacity: 0.12,
    elevation: 4,
  },
  todayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 2,
    borderColor: '#F2F2F7',
  },
  todayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  todayCardBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  todayCardBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  todayCardDuration: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: 'System',
  },
  todayCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1D1D1F',
    fontFamily: 'System',
  },
  todayCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  todayCardCTA: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1D1D1F',
    fontFamily: 'System',
  },
  todayPlayButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  todayPlayIcon: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'System',
    marginLeft: 1,
  },
  recommendedCopy: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  tomorrowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  tomorrowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  tomorrowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tomorrowIconText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tomorrowLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: 'System',
  },
  tomorrowTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1D1D1F',
    fontFamily: 'System',
  },
  tomorrowMeta: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 10,
    fontFamily: 'System',
  },
  tomorrowDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#636366',
    fontFamily: 'System',
  },
  tomorrowCardLocked: {
    opacity: 0.6,
    borderColor: '#D1D1D6',
    borderStyle: 'dashed',
  },
  tomorrowIconLocked: {
    backgroundColor: '#D1D1D6',
  },
  tomorrowLockedContent: {
    flex: 1,
  },
  tomorrowLockedTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#8E8E93',
    fontFamily: 'System',
    marginBottom: 4,
  },
  tomorrowLockedDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8E8E93',
    fontFamily: 'System',
  },
});