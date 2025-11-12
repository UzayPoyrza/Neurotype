import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Dimensions, LayoutChangeEvent } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Session } from '../types';
import { MentalHealthModule } from '../data/modules';
import { mockSessions } from '../data/mockData';
import { useStore } from '../store/useStore';
import { useInstagramScrollDetection } from '../hooks/useInstagramScrollDetection';

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
  const revealTranslateY = useRef(new Animated.Value(0)).current;
  const revealBarContentOpacity = useRef(new Animated.Value(1)).current;
  const topShellBorderOpacity = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);
  const lastScrollY = useRef(0);
  const slideRange = 56; // Height to slide pills behind title
  const revealBarHeight = 56; // Height of the pill buttons bar

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

  // Show reveal bar (pills)
  const showRevealBar = useCallback(() => {
    if (!isAnimating.current) {
      isAnimating.current = true;
      Animated.parallel([
        Animated.timing(revealTranslateY, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(revealBarContentOpacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start(() => {
        isAnimating.current = false;
      });
    }
  }, [revealTranslateY, revealBarContentOpacity]);

  // Hide reveal bar (pills)
  const hideRevealBar = useCallback(() => {
    if (!isAnimating.current) {
      isAnimating.current = true;
      Animated.parallel([
        Animated.timing(revealTranslateY, {
          toValue: -slideRange,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(revealBarContentOpacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start(() => {
        isAnimating.current = false;
      });
    }
  }, [revealTranslateY, revealBarContentOpacity, slideRange]);

  // Scroll detection hook
  const { scrollY, handleScroll, handleTouchStart, handleTouchEnd } = useInstagramScrollDetection({
    onScrollEnd: (direction) => {
      if (direction === 'up') {
        showRevealBar();
      } else {
        hideRevealBar();
      }
    },
    scrollViewHeight,
    contentHeight,
    headerHeight: 191, // TopShell (135) + RevealBar (56)
  });

  // Link scroll Y to reveal bar position (1:1 movement)
  useEffect(() => {
    if (scrollY && !isAnimating.current) {
      const listener = scrollY.addListener(({ value }) => {
        const scrollDifference = value - lastScrollY.current;
        
        if (Math.abs(scrollDifference) > 3 && value >= 0) {
          const currentTranslateY = (revealTranslateY as any)._value || 0;
          
          // Check if we're at the bottom
          const isAtBottom = contentHeight > 0 && scrollViewHeight > 0 && 
            value + scrollViewHeight >= contentHeight - 10;
          
          const scrollableHeight = contentHeight - scrollViewHeight;
          const bottomThreshold = scrollableHeight * 0.9999;
          const isInBottom10Percent = value >= bottomThreshold;
          
          if ((isAtBottom && scrollDifference > 0) || isInBottom10Percent) {
            revealTranslateY.setValue(-slideRange);
          } else {
            const newTranslateY = scrollDifference > 0 
              ? Math.max(currentTranslateY - Math.abs(scrollDifference), -slideRange)
              : Math.min(currentTranslateY + Math.abs(scrollDifference), 0);
            
            revealTranslateY.setValue(newTranslateY);
          }
        }
        
        lastScrollY.current = value;
      });

      return () => scrollY.removeListener(listener);
    }
  }, [scrollY, revealTranslateY, contentHeight, scrollViewHeight, slideRange]);

  // Animate border and content opacity based on reveal bar position
  useEffect(() => {
    const listener = revealTranslateY.addListener(({ value }) => {
      const progress = Math.abs(value) / slideRange;
      
      // Top border fades in when reveal bar is hidden
      const borderOpacity = progress < 0.8 ? 0 : Math.pow((progress - 0.8) / 0.2, 3);
      topShellBorderOpacity.setValue(Math.min(borderOpacity, 1));
      
      // Content opacity fades out as reveal bar hides
      const contentOpacity = Math.max(Math.pow(1 - progress, 2), 0);
      revealBarContentOpacity.setValue(contentOpacity);
    });

    return () => revealTranslateY.removeListener(listener);
  }, [revealTranslateY, topShellBorderOpacity, revealBarContentOpacity, slideRange]);

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
      y: Math.max(0, target - 191), // Header height (191) + some offset
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
        style={styles.section}
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
              <View style={[styles.completedBadge, { backgroundColor: module.color }]}>
                <Text style={styles.completedBadgeIcon}>✓</Text>
              </View>
              <Text style={styles.completedTitle} numberOfLines={2}>
                {item.session.title}
              </Text>
              <Text style={styles.completedMeta}>
                {item.session.durationMin} min • {item.session.modality}
              </Text>
              <Text style={styles.completedDate}>{formatDate(item.completedDate)}</Text>
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
    if (!todayCompleted || !tomorrowSession) {
      return null;
    }

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
          <Text style={styles.sectionTitle}>Unlocked for Tomorrow</Text>
          <Text style={styles.sectionSubtitle}>You'll see this after tomorrow's check-in</Text>
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
        {/* RevealBar - Contains pill buttons, slides behind TopShell */}
        <Animated.View
          style={[
            styles.revealBar,
            { backgroundColor: '#FFFFFF' },
            {
              transform: [{ translateY: revealTranslateY }],
            }
          ]}
        >
          <Animated.View
            style={[
              styles.revealBarContent,
              {
                opacity: revealBarContentOpacity,
              }
            ]}
          >
            {renderQuickJump()}
          </Animated.View>
          {/* Border at bottom of revealBar when visible */}
          <Animated.View
            style={[
              styles.revealBarBorder,
              {
                opacity: revealBarContentOpacity,
              }
            ]}
          />
        </Animated.View>

        {/* TopShell - Always visible with title */}
        <Animated.View
          style={[
            styles.topShell,
            { backgroundColor: '#FFFFFF' }
          ]}
        >
          <View style={styles.topShellContent}>
            <TouchableOpacity
              onPress={onBackPress || (() => navigation.goBack())}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {module.title + " Journey"}
            </Text>
          </View>
          {/* Animated border that appears when reveal bar is hidden */}
          <Animated.View
            style={[
              styles.topShellBorder,
              {
                opacity: topShellBorderOpacity,
              }
            ]}
          />
        </Animated.View>
      </View>

      {/* ScrollView with content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.bodyScroll}
        contentContainerStyle={styles.bodyContent}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        scrollEventThrottle={1}
        showsVerticalScrollIndicator={false}
        bounces={false}
        onLayout={handleScrollViewLayout}
        onContentSizeChange={(width, height) => {
          setContentHeight(height);
        }}
      >
        <View onLayout={handleContentLayout}>
          <View style={[styles.summaryCard, { borderColor: module.color }]}>
            <Text style={styles.summaryTitle}>Module Progress</Text>
            <Text style={styles.summaryCopy}>
              {todayCompleted
                ? 'Great job today—come back tomorrow to stay on pace.'
                : 'Stay consistent by choosing one of today\'s meditations.'}
            </Text>
            <View style={styles.summaryProgressRow}>
              <View style={[styles.progressDot, { backgroundColor: module.color }]} />
              <View style={styles.progressLine} />
              <View style={styles.progressDotMuted} />
            </View>
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
    height: 135, // Fixed height to fully contain title
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1001,
    backgroundColor: '#FFFFFF',
  },
  topShellContent: {
    paddingTop: 48,
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
  revealBar: {
    height: 56,
    position: 'absolute',
    top: 135, // Start below TopShell - right below title "Anxiety Journey"
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#FFFFFF',
  },
  revealBarContent: {
    height: 56,
    paddingHorizontal: 24,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  revealBarBorder: {
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
    paddingTop: 191, // TopShell (135) + RevealBar (56)
  },
  bodyContent: {
    paddingHorizontal: 24,
    paddingBottom: 64,
    gap: 28,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
    fontFamily: 'System',
  },
  summaryCopy: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 21,
    color: '#636366',
    fontFamily: 'System',
  },
  summaryProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  progressDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 8,
    borderRadius: 1,
  },
  progressDotMuted: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E5EA',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
    fontFamily: 'System',
  },
  summaryStatLabel: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'System',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E5E5EA',
  },
  section: {
    width: '100%',
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
    borderRadius: 18,
    padding: 16,
    width: 220,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  completedBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  completedBadgeIcon: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    lineHeight: 21,
    marginBottom: 6,
    fontFamily: 'System',
  },
  completedMeta: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
    fontFamily: 'System',
  },
  completedDate: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
    fontFamily: 'System',
  },
  todayList: {
    gap: 12,
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
    padding: 18,
    borderWidth: 2,
    borderColor: '#F2F2F7',
  },
  todayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
    marginTop: 16,
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
    marginTop: 12,
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
});