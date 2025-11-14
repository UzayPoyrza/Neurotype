import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Dimensions, LayoutChangeEvent, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Session } from '../types';
import { MentalHealthModule } from '../data/modules';
import { mockSessions } from '../data/mockData';
import { useStore } from '../store/useStore';
import { theme } from '../styles/theme';

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

type TabType = 'timeline' | 'overview';

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
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const scrollX = useRef(new Animated.Value(0)).current;
  const horizontalScrollRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get('window').width;

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

  const handleTabChange = (tab: TabType) => {
    const tabIndex = tab === 'timeline' ? 0 : 1;
    
    // Scroll to the appropriate page
    horizontalScrollRef.current?.scrollTo({
      x: tabIndex * screenWidth,
      animated: true,
    });
    
    setActiveTab(tab);
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    
    // Update scrollX animated value for tab indicator
    scrollX.setValue(offsetX);
    
    const tabIndex = Math.round(offsetX / screenWidth);
    
    // Update active tab based on scroll position
    const newTab = tabIndex === 0 ? 'timeline' : 'overview';
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  };

  const handleScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const maxScrollX = screenWidth; // Maximum scroll position (Overview page)
    
    // Check if we're at the left edge (Timeline page) and scrolled beyond it
    if (offsetX < -30) {
      // Navigate back
      if (onBackPress) {
        onBackPress();
      } else {
        navigation.goBack();
      }
      return;
    }
    
    // Check if we're at the right edge (Overview page) and scrolled beyond it
    if (offsetX > maxScrollX + 30) {
      // Snap back to the Overview page
      horizontalScrollRef.current?.scrollTo({
        x: maxScrollX,
        animated: true,
      });
    }
  };

  const handleMomentumScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    
    // Check if we're at the left edge (Timeline page) and scrolled beyond it
    if (offsetX < -30) {
      // Navigate back
      if (onBackPress) {
        onBackPress();
      } else {
        navigation.goBack();
      }
    }
  };


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

  // Layout handlers
  const handleScrollViewLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setScrollViewHeight(height);
  }, []);

  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setContentHeight(height);
  }, []);

  const renderTimelinePage = () => (
    <ScrollView 
      style={[styles.page, { width: screenWidth }]} 
      contentContainerStyle={styles.pageContent}
    >
      <View style={styles.timelineContainer}>
        <Text style={styles.timelineTitle}>Neuroadaptation</Text>
        <Text style={styles.timelineSubtitle}>
          Track your brain's adaptation to meditation practice
        </Text>
        
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderIcon}>🧠</Text>
          <Text style={styles.placeholderTitle}>Coming Soon</Text>
          <Text style={styles.placeholderText}>
            The neuroadaptation timeline will show how your brain changes over time as you practice meditation.
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderOverviewPage = () => (
    <ScrollView
      ref={scrollViewRef}
      style={[styles.page, { width: screenWidth }]}
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
  );

  return (
    <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* Sticky Header */}
        <View style={styles.stickyHeader}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={onBackPress || (() => navigation.goBack())}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">{titleText}</Text>
            <View style={styles.headerActions} />
          </View>
          
          {/* Tabs in Header */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'timeline' && styles.activeTab]}
              onPress={() => handleTabChange('timeline')}
            >
              <Text style={[styles.tabText, activeTab === 'timeline' && styles.activeTabText]}>
                Neuroadaptation
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
              onPress={() => handleTabChange('overview')}
            >
              <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
                Overview
              </Text>
            </TouchableOpacity>
            
            {/* Animated Indicator */}
            <Animated.View 
              style={[
                styles.tabIndicator,
                {
                  transform: [{
                    translateX: scrollX.interpolate({
                      inputRange: [0, screenWidth],
                      outputRange: [
                        ((screenWidth - 32) / 2) / 2 - 60, // Center of first tab minus half indicator width (120/2)
                        ((screenWidth - 32) / 2) + ((screenWidth - 32) / 2) / 2 - 60, // Center of second tab minus half indicator width (120/2)
                      ],
                      extrapolate: 'clamp',
                    })
                  }]
                }
              ]} 
            />
          </View>
        </View>

        {/* Horizontal ScrollView for pages */}
        <ScrollView
          ref={horizontalScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onScrollEndDrag={handleScrollEnd}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
          style={styles.horizontalScrollView}
          bounces={false}
        >
          {/* Timeline Page */}
          {renderTimelinePage()}
          
          {/* Overview Page */}
          {renderOverviewPage()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.health.container.backgroundColor,
  },
  safeArea: {
    flex: 1,
  },
  stickyHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 100,
    paddingTop: 44, // Status bar height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 44, // Fixed height to prevent layout shifts
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 24,
    fontWeight: '400',
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerActions: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    height: 44, // Fixed height to prevent layout shifts
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    // Active tab styling handled by text color
  },
  tabText: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 120,
    height: 2,
    backgroundColor: '#007AFF',
    borderRadius: 1,
  },
  horizontalScrollView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
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
  timelineContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  timelineTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  timelineSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text.secondary,
    marginBottom: 24,
  },
  placeholderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 300,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});