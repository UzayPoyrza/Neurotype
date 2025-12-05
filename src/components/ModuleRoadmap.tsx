import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Dimensions, LayoutChangeEvent, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Session } from '../types';
import { MentalHealthModule } from '../data/modules';
import { mockSessions } from '../data/mockData';
import { useStore, createCompletionBackground } from '../store/useStore';
import { theme } from '../styles/theme';
import { useUserId } from '../hooks/useUserId';
import { getUserCompletedSessions } from '../services/progressService';
import { getSessionById } from '../services/sessionService';

type TodayStackParamList = {
  TodayMain: undefined;
  Roadmap: undefined;
  MeditationDetail: { sessionId: string };
};

type ModuleRoadmapNavigationProp = StackNavigationProp<TodayStackParamList>;

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

interface Milestone {
  id: string;
  title: string;
  timeRange: string;
  sessionsRequired: number;
  description: string;
  whatYouFeel: string;
}

interface NeuroadaptationCardProps {
  milestone: Milestone;
  progress: number;
  isUnlocked: boolean;
  isPartiallyComplete: boolean;
  totalSessions: number;
  index: number;
  accentColor: string;
}

const NeuroadaptationCard: React.FC<NeuroadaptationCardProps> = ({
  milestone,
  progress,
  isUnlocked,
  isPartiallyComplete,
  totalSessions,
  index,
  accentColor,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Stagger card animations
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: progress / 100,
      duration: 1200,
      delay: 300 + index * 100,
      useNativeDriver: false,
    }).start();
  }, [progress, index, cardOpacity, cardScale, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const progressOpacity = progressAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 1],
    extrapolate: 'clamp',
  });

  // Convert hex to RGB for rgba colors
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 255, g: 107, b: 107 }; // Default to red
  };

  const rgb = hexToRgb(accentColor);
  const lightColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
  const borderColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`;

  return (
    <Animated.View
      style={[
        styles.neuroCard,
        {
          opacity: cardOpacity,
          transform: [{ scale: cardScale }],
          borderLeftWidth: 3,
          borderLeftColor: borderColor,
        },
      ]}
    >
      <View style={styles.neuroCardHeader}>
        <View style={styles.neuroCardTitleRow}>
          <Text style={styles.neuroCardTitle}>{milestone.title}</Text>
          {isUnlocked && (
            <View style={[styles.checkmarkBadge, { backgroundColor: accentColor }]}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </View>
        <Text style={styles.neuroCardTimeRange}>{milestone.timeRange}</Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarTrack}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressWidth,
                opacity: progressOpacity,
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressPercentage, { color: accentColor }]}>
          {Math.round(progress)}%
        </Text>
      </View>

      <Text style={styles.neuroCardDescription}>{milestone.description}</Text>

      {isPartiallyComplete || isUnlocked ? (
        <View style={[
          styles.whatYouFeelContainer,
          {
            borderLeftColor: accentColor,
            backgroundColor: lightColor,
          }
        ]}>
          <Text style={[styles.whatYouFeelLabel, { color: accentColor }]}>What you feel:</Text>
          <Text style={styles.whatYouFeelText}>{milestone.whatYouFeel}</Text>
        </View>
      ) : (
        <Text style={styles.sessionsRequired}>
          {milestone.sessionsRequired - totalSessions} more sessions to unlock
        </Text>
      )}
    </Animated.View>
  );
};

export const ModuleRoadmap: React.FC<ModuleRoadmapProps> = ({
  module,
  todayCompleted = false,
  triggerUnlockAnimation = false,
  onUnlockComplete,
  onSessionSelect,
  onBackPress,
}) => {
  const navigation = useNavigation<ModuleRoadmapNavigationProp>();
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  const isSessionCompletedToday = useStore(state => state.isSessionCompletedToday);
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const screenWidth = Dimensions.get('window').width;
  const scrollX = useRef(new Animated.Value(0)).current; // Initialize to timeline tab position
  const horizontalScrollRef = useRef<ScrollView>(null);
  const completedScrollRef = useRef<ScrollView>(null);
  const [showScrollArrow, setShowScrollArrow] = useState(true);
  const scrollArrowOpacity = useRef(new Animated.Value(1)).current;
  const scrollViewWidth = useRef(0);

  const userProgress = useStore(state => state.userProgress);
  const userId = useUserId();
  const [fetchedCompletedSessions, setFetchedCompletedSessions] = useState<CompletedMeditation[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  
  // Fetch actual completed sessions from database
  useEffect(() => {
    const fetchCompletedSessions = async () => {
      if (!userId) {
        setFetchedCompletedSessions([]);
        return;
      }

      setIsLoadingSessions(true);
      try {
        // Fetch all completed sessions (we'll filter by module later)
        const completedSessionsData = await getUserCompletedSessions(userId, 50); // Get up to 50 most recent
        
        // Filter by current module
        const moduleCompletedSessions = completedSessionsData.filter(
          cs => cs.context_module === module.id
        );

        // Fetch session details for each completed session
        const sessionPromises = moduleCompletedSessions.map(async (cs) => {
          const session = await getSessionById(cs.session_id);
          if (!session) return null;
          
          return {
            id: cs.id || `${module.id}-completed-${cs.session_id}-${cs.completed_date}`,
            session: session,
            completedDate: new Date(cs.completed_date || cs.created_at || Date.now()),
          } as CompletedMeditation;
        });

        const results = await Promise.all(sessionPromises);
        const validSessions = results.filter((item): item is CompletedMeditation => item !== null);
        
        // Sort by completed date (most recent first) - most recent on the left
        validSessions.sort((a, b) => b.completedDate.getTime() - a.completedDate.getTime());
        
        // Limit to 6 most recent
        setFetchedCompletedSessions(validSessions.slice(0, 6));
      } catch (error) {
        console.error('Error fetching completed sessions:', error);
        setFetchedCompletedSessions([]);
      } finally {
        setIsLoadingSessions(false);
      }
    };

    fetchCompletedSessions();
  }, [userId, module.id]);
  
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

    // Use fetched completed sessions from database (already sorted with most recent first)
    // Most recent will appear on the left (first in array)
    const completedSessions = fetchedCompletedSessions;

    const todayCount = Math.min(3, Math.max(1, moduleSessions.length - completedSessions.length));

    const todaySessions = moduleSessions
      .slice(completedSessions.length, completedSessions.length + todayCount)
      .map((session, idx) => ({
        ...session,
        id: `${session.id}-today-${idx}`,
      }));

    const tomorrowCandidate = moduleSessions[completedSessions.length + todayCount];
    
    // Always create a tomorrow session - use a placeholder if none available
    const tomorrowSession = tomorrowCandidate
      ? {
          ...tomorrowCandidate,
          id: `${tomorrowCandidate.id}-tomorrow`,
        }
      : moduleSessions.length > 0
      ? {
          ...moduleSessions[0],
          id: `${moduleSessions[0].id}-tomorrow-placeholder`,
        }
      : undefined;

    return {
      completedSessions,
      todaySessions,
      tomorrowSession,
    };
  }, [module, fetchedCompletedSessions]);

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



  const renderCompletedMeditations = () => {
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
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          <Text style={styles.sectionSubtitle}>
            {completedSessions.length > 0 
              ? `${completedSessions.length} completed ${completedSessions.length === 1 ? 'session' : 'sessions'}`
              : 'Your completed meditations will appear here'}
          </Text>
        </View>
        {completedSessions.length === 0 ? (
          <View style={[styles.tomorrowCard, styles.tomorrowCardLocked]}>
            <View style={styles.tomorrowHeader}>
              <View style={[styles.tomorrowIcon, styles.tomorrowIconLocked, { backgroundColor: '#D1D1D6' }]}>
                <Text style={styles.tomorrowIconText}>🔒</Text>
              </View>
              <View style={styles.tomorrowLockedContent}>
                <Text style={styles.tomorrowLockedTitle}>Complete a meditation</Text>
                <Text style={styles.tomorrowLockedDescription}>
                  Finish a session to see it here
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.completedScrollContainer}>
            <ScrollView
              ref={completedScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.completedScrollContent}
              bounces={false}
              onScroll={(event) => {
                const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                const isAtEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 10;
                const hasOverflow = contentSize.width > layoutMeasurement.width;
                
                if (isAtEnd || !hasOverflow) {
                  if (showScrollArrow) {
                    setShowScrollArrow(false);
                    Animated.timing(scrollArrowOpacity, {
                      toValue: 0,
                      duration: 300,
                      useNativeDriver: true,
                    }).start();
                  }
                } else {
                  if (!showScrollArrow) {
                    setShowScrollArrow(true);
                    Animated.timing(scrollArrowOpacity, {
                      toValue: 1,
                      duration: 300,
                      useNativeDriver: true,
                    }).start();
                  }
                }
              }}
              onLayout={(event) => {
                scrollViewWidth.current = event.nativeEvent.layout.width;
              }}
              onContentSizeChange={(contentWidth, contentHeight) => {
                // Check if there's overflow on content size change
                const hasOverflow = contentWidth > scrollViewWidth.current;
                if (!hasOverflow && showScrollArrow) {
                  setShowScrollArrow(false);
                  Animated.timing(scrollArrowOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                  }).start();
                } else if (hasOverflow && !showScrollArrow) {
                  setShowScrollArrow(true);
                  Animated.timing(scrollArrowOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                  }).start();
                }
              }}
              scrollEventThrottle={16}
            >
              {completedSessions.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.completedCard}
                  onPress={() => navigation.navigate('MeditationDetail', { sessionId: item.session.id })}
                  activeOpacity={0.7}
                >
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
                </TouchableOpacity>
              ))}
            </ScrollView>
            {completedSessions.length > 0 && (
              <Animated.View
                style={[
                  styles.scrollArrow,
                  {
                    opacity: scrollArrowOpacity,
                  },
                ]}
                pointerEvents="none"
              >
                <Text style={styles.scrollArrowText}>›</Text>
              </Animated.View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderTodayPlan = () => {
    // Only show the recommended session
    const recommendedSession = todaySessions.find(session => session.id === todayRecommendedSessionId);
    
    if (!recommendedSession) {
      return null;
    }

    // Check if this session is completed (remove -today suffix to get original ID)
    const originalSessionId = recommendedSession.id.split('-today')[0];
    const isCompleted = isSessionCompletedToday(module.id, originalSessionId) || todayCompleted;
    
    // Get completion background color
    const completionBackgroundColor = createCompletionBackground(
      module.color,
      globalBackgroundColor
    );

    const scale = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.04],
    });
    const shadowOpacity = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.12, 0.3],
    });

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
            {todayCompleted ? 'You finished today\'s check-in 🎉' : 'Your recommended meditation for today'}
          </Text>
        </View>
        <View style={styles.todayList}>
          <Animated.View
            style={[
              styles.todayCardWrapper,
              {
                transform: [{ scale }],
                shadowOpacity,
                shadowColor: module.color,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate('MeditationDetail', { sessionId: recommendedSession.id })}
              activeOpacity={0.85}
              style={[
                styles.todayCard,
                { 
                  borderColor: module.color, 
                  backgroundColor: isCompleted ? completionBackgroundColor : '#F7F9FF' 
                },
              ]}
            >
              <View style={styles.todayCardHeader}>
                <Text style={styles.todayCardDuration}>
                  {recommendedSession.durationMin} min • {recommendedSession.modality}
                </Text>
              </View>
              <Text
                style={[styles.todayCardTitle, { color: module.color }]}
                numberOfLines={2}
              >
                {recommendedSession.title}
              </Text>
              <View style={[styles.todayCardFooter, isCompleted && styles.todayCardFooterCompleted]}>
                {isCompleted ? (
                  <View style={styles.todayCompletedButton}>
                    <Text style={styles.todayCompletedCheckmark}>✓</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.todayCardCTA}>Begin session</Text>
                    <View style={[styles.todayPlayButton, { backgroundColor: module.color }]}>
                      <Text style={styles.todayPlayIcon}>▶</Text>
                    </View>
                  </>
                )}
              </View>
              <Text style={styles.recommendedCopy}>
                Recommended for you today
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  };

  const renderTomorrowPreview = () => {
    // Always show locked version when today is not completed
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

    // Preview version when today is completed - only show if tomorrowSession exists
    if (!tomorrowSession) {
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

  const renderTimelinePage = () => {
    const totalSessions = userProgress.sessionDeltas.length;
    
    // Calculate progress for each milestone based on sessions completed
    const milestones = [
      {
        id: 'week1',
        title: 'Reduced amygdala activity',
        timeRange: '0–1 Week',
        sessionsRequired: 7,
        description: 'Lower acute stress reactivity. Heart rate decreases, parasympathetic activation increases. Improved attention for short periods.',
        whatYouFeel: 'Slight calm after sessions, more aware of anxious thoughts, some restlessness (very normal at start)',
      },
      {
        id: 'weeks2-4',
        title: 'Increased prefrontal cortex regulation',
        timeRange: '2–4 Weeks',
        sessionsRequired: 28,
        description: 'Better impulse control & emotional regulation. Reduced cortisol baseline levels. Thicker hippocampal gray matter begins.',
        whatYouFeel: 'Anxiety decreases slightly but consistently, better sleep onset, you notice reactions before they happen, mood is more stable',
      },
      {
        id: 'weeks6-8',
        title: 'Amygdala density reduction',
        timeRange: '6–8 Weeks',
        sessionsRequired: 56,
        description: 'Amygdala shrinks in density. Hippocampus increases (memory + learning). Default Mode Network activity decreases → Less rumination.',
        whatYouFeel: 'Noticeably lower anxiety baseline, stress hits you less intensely, emotional resilience increases, mind wandering drops',
      },
      {
        id: '3months',
        title: 'Stronger frontal-limbic connectivity',
        timeRange: '3 Months',
        sessionsRequired: 90,
        description: 'You regulate emotions automatically. Significant improvements in working memory. Lower blood pressure in many adults.',
        whatYouFeel: 'Anxiety triggers don\'t hit as hard, you handle conflict more smoothly, you recover from stress much faster',
      },
      {
        id: '6months',
        title: 'Permanent structural changes',
        timeRange: '6 Months',
        sessionsRequired: 180,
        description: 'Permanent structural changes in prefrontal cortex, anterior cingulate cortex, and insula. DMN quieting becomes your default.',
        whatYouFeel: 'Overall anxiety level drops 30–40% on average, you begin feeling "centered" most days, your mind feels clearer',
      },
      {
        id: '1year',
        title: 'Deep neural transformation',
        timeRange: '1 Year',
        sessionsRequired: 365,
        description: 'Gamma-wave activity increases. Massive increases in cortical thickness. Stronger white-matter pathways for emotional regulation.',
        whatYouFeel: 'Deep, stable calm under most conditions, fast recovery from stress, very strong "observer mind" — thoughts don\'t control you anymore',
      },
    ];

    return (
      <ScrollView 
        style={[styles.page, { width: screenWidth }]} 
        contentContainerStyle={styles.timelinePageContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timelineContainer}>
          {milestones.map((milestone, index) => {
            const progress = Math.min(100, (totalSessions / milestone.sessionsRequired) * 100);
            const isUnlocked = totalSessions >= milestone.sessionsRequired;
            const isPartiallyComplete = totalSessions > 0 && totalSessions < milestone.sessionsRequired;
            
            return (
              <NeuroadaptationCard
                key={milestone.id}
                milestone={milestone}
                progress={progress}
                isUnlocked={isUnlocked}
                isPartiallyComplete={isPartiallyComplete}
                totalSessions={totalSessions}
                index={index}
                accentColor={module.color}
              />
            );
          })}
        </View>
      </ScrollView>
    );
  };

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
          <Text style={styles.summaryTitle}>{module.title} Progress</Text>
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
                  width: screenWidth / 2,
                  transform: [{
                    translateX: scrollX.interpolate({
                      inputRange: [0, screenWidth],
                      outputRange: [
                        0, // First tab: indicator starts at left edge of screen
                        screenWidth / 2, // Second tab: indicator extends to right edge of screen
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
    paddingTop: 52, // Status bar height
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
    paddingHorizontal: 0,
    height: 44, // Fixed height to prevent layout shifts
  },
  tab: {
    width: '50%',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  completedScrollContainer: {
    position: 'relative',
  },
  completedScrollContent: {
    paddingRight: 12,
    gap: 12,
  },
  scrollArrow: {
    position: 'absolute',
    right: -2,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 10,
    paddingRight: 0,
  },
  scrollArrowText: {
    fontSize: 40,
    color: '#000000',
    fontWeight: '300',
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
    paddingBottom: 12,
    borderWidth: 2,
    borderColor: '#F2F2F7',
    position: 'relative',
  },
  todayCardCheckmark: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  todayCardCheckmarkIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'System',
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
    marginBottom: 0,
  },
  todayCardFooterCompleted: {
    justifyContent: 'flex-end',
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
  todayCompletedButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#34c759',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  todayCompletedCheckmark: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  recommendedCopy: {
    marginTop: 0,
    fontSize: 12,
    fontWeight: '600',
    color: '#1D1D1F',
    fontFamily: 'System',
  },
  tomorrowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    paddingVertical: 24,
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
    marginBottom: 0,
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
    justifyContent: 'center',
    minHeight: 100,
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
  timelinePageContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 85,
  },
  timelineContainer: {
    width: '100%',
  },
  timelineTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 8,
    fontFamily: 'System',
  },
  timelineSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#8E8E93',
    marginBottom: 24,
    fontFamily: 'System',
  },
  timelineStats: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginRight: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1D1D1F',
    fontFamily: 'System',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    fontFamily: 'System',
  },
  neuroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  neuroCardHeader: {
    marginBottom: 16,
  },
  neuroCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  neuroCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    fontFamily: 'System',
    flex: 1,
  },
  checkmarkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkmarkText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'System',
  },
  neuroCardTimeRange: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    fontFamily: 'System',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
    minWidth: 50,
    textAlign: 'right',
  },
  neuroCardDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#636366',
    marginBottom: 12,
    fontFamily: 'System',
  },
  whatYouFeelContainer: {
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
  },
  whatYouFeelLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: 'System',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  whatYouFeelText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#636366',
    fontFamily: 'System',
  },
  sessionsRequired: {
    fontSize: 13,
    color: '#8E8E93',
    fontStyle: 'italic',
    fontFamily: 'System',
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