import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Dimensions, LayoutChangeEvent, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Session } from '../types';
import { MentalHealthModule } from '../data/modules';
import { mockSessions } from '../data/mockData';
import { useStore, createCompletionBackground } from '../store/useStore';
import { useTheme } from '../contexts/ThemeContext';
import { useUserId } from '../hooks/useUserId';
import { getUserCompletedSessions, isSessionCompleted } from '../services/progressService';
import { getSessionById } from '../services/sessionService';
import { supabase } from '../services/supabase';
import { ShimmerNeuroadaptationCard } from './ShimmerSkeleton';

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
  recommendedSession?: Session;
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
  isActive: boolean;
  isLast: boolean;
}

const NeuroadaptationCard: React.FC<NeuroadaptationCardProps> = ({
  milestone,
  progress,
  isUnlocked,
  isPartiallyComplete,
  totalSessions,
  index,
  accentColor,
  isActive,
  isLast,
}) => {
  const theme = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(isActive);
  const dropdownAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(cardOpacity, {
      toValue: 1,
      duration: 350,
      delay: index * 80,
      useNativeDriver: true,
    }).start();

    Animated.timing(progressAnim, {
      toValue: progress / 100,
      duration: 1000,
      delay: 200 + index * 80,
      useNativeDriver: false,
    }).start();
  }, [progress, index, cardOpacity, progressAnim]);

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    Animated.spring(dropdownAnim, {
      toValue: next ? 1 : 0,
      tension: 120,
      friction: 14,
      useNativeDriver: true,
    }).start();
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const chevronRotation = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Node colors based on state
  const lineColor = isUnlocked ? accentColor + '40' : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)');
  const textOpacity = isUnlocked || isPartiallyComplete ? 1 : 0.45;
  const sessionsLeft = milestone.sessionsRequired - totalSessions;

  return (
    <Animated.View style={[styles.timelineRow, { opacity: cardOpacity }]}>
      {/* Left: Node + Connecting Line */}
      <View style={styles.timelineLeftColumn}>
        {isUnlocked ? (
          <View style={[styles.timelineNodeComplete, { backgroundColor: accentColor }]}>
            <Text style={styles.timelineNodeCheck}>✓</Text>
          </View>
        ) : isPartiallyComplete ? (
          <View style={[styles.timelineNodeActive, { borderColor: accentColor }]}>
            <View style={[styles.timelineNodeActiveDot, { backgroundColor: accentColor }]} />
          </View>
        ) : (
          <View style={[styles.timelineNodeLocked, { borderColor: theme.isDark ? '#3A3A3C' : '#d1d1d6' }]} />
        )}
        {!isLast && (
          <View style={[styles.timelineConnector, { backgroundColor: lineColor }]} />
        )}
      </View>

      {/* Right: Content */}
      <View style={[styles.timelineContent, { opacity: textOpacity }]}>
        {/* Tappable header */}
        <TouchableOpacity activeOpacity={0.7} onPress={toggleExpanded}>
          <View style={styles.timelineMilestoneHeader}>
            <Text
              style={[
                styles.timelineMilestoneTitle,
                { color: theme.colors.text.primary },
                isUnlocked && { color: accentColor },
              ]}
              numberOfLines={2}
            >
              {milestone.title}
            </Text>
            <View style={styles.timelineHeaderRight}>
              {(isUnlocked || isPartiallyComplete) && (
                <View style={[
                  styles.timelineProgressChip,
                  {
                    backgroundColor: isUnlocked
                      ? accentColor + '18'
                      : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                  },
                ]}>
                  <Text style={[
                    styles.timelineProgressChipText,
                    { color: isUnlocked ? accentColor : theme.colors.text.secondary },
                  ]}>
                    {Math.round(progress)}%
                  </Text>
                </View>
              )}
              <Animated.View
                style={[
                  styles.timelineChevronBtn,
                  {
                    backgroundColor: theme.isDark ? '#0A84FF' : '#007AFF',
                    transform: [{ rotate: chevronRotation }],
                  },
                ]}
              >
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color="#FFFFFF"
                />
              </Animated.View>
            </View>
          </View>

          {/* Time range */}
          <Text style={[styles.timelineMilestoneTime, { color: theme.colors.text.tertiary }]}>
            {milestone.timeRange}
          </Text>
        </TouchableOpacity>

        {/* Progress bar — only for in-progress milestones */}
        {isPartiallyComplete && !isUnlocked && (
          <View style={styles.timelineProgressBarWrap}>
            <View style={[styles.timelineProgressTrack, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
              <Animated.View
                style={[
                  styles.timelineProgressFill,
                  { width: progressWidth, backgroundColor: accentColor },
                ]}
              />
            </View>
          </View>
        )}

        {/* Expandable details */}
        {expanded && (
          <View style={styles.timelineExpandedContent}>
            <Text style={[styles.timelineMilestoneDesc, { color: theme.colors.text.secondary }]}>
              {milestone.description}
            </Text>

            <View style={[
              styles.timelineFeelBox,
              {
                backgroundColor: accentColor + (theme.isDark ? '10' : '08'),
                borderColor: accentColor + '30',
              },
            ]}>
              <Text style={[styles.timelineFeelLabel, { color: accentColor }]}>What you'll feel</Text>
              <Text style={[styles.timelineFeelText, { color: theme.colors.text.secondary }]}>{milestone.whatYouFeel}</Text>
            </View>
          </View>
        )}

        {/* Sessions remaining — only for locked milestones */}
        {!expanded && !isUnlocked && !isPartiallyComplete && (
          <Text style={[styles.timelineSessionsLeft, { color: theme.colors.text.tertiary }]}>
            {sessionsLeft} session{sessionsLeft !== 1 ? 's' : ''} away
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

export const ModuleRoadmap: React.FC<ModuleRoadmapProps> = ({
  module,
  recommendedSession,
  todayCompleted = false,
  triggerUnlockAnimation = false,
  onUnlockComplete,
  onSessionSelect,
  onBackPress,
}) => {
  const theme = useTheme();
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
  const scrollArrowScale = useRef(new Animated.Value(0)).current;
  const scrollViewWidth = useRef(0);

  const userProgress = useStore(state => state.userProgress);
  const userId = useUserId();
  const [fetchedCompletedSessions, setFetchedCompletedSessions] = useState<CompletedMeditation[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true); // Start with loading true

  // Fetch actual completed sessions from database
  useEffect(() => {
    const fetchCompletedSessions = async () => {
      if (!userId) {
        setFetchedCompletedSessions([]);
        setIsLoadingSessions(false);
        return;
      }

      setIsLoadingSessions(true);
      try {
        // 1. Fetch ALL completed sessions (don't filter by context_module yet)
        const completedSessionsData = await getUserCompletedSessions(userId, 50);

        if (completedSessionsData.length === 0) {
          setFetchedCompletedSessions([]);
          return;
        }

        // 2. Get unique session IDs from all completed sessions
        const uniqueSessionIds = Array.from(
          new Set(completedSessionsData.map(cs => cs.session_id))
        );

        // 3. Batch fetch session_modalities for all unique sessions (1 query)
        const { data: modalitiesData, error: modalitiesError } = await supabase
          .from('session_modalities')
          .select('session_id, modality')
          .in('session_id', uniqueSessionIds);

        if (modalitiesError) {
          console.error('Error fetching session modalities:', modalitiesError);
          setFetchedCompletedSessions([]);
          return;
        }

        // 4. Create a map: session_id -> array of modules it belongs to
        const sessionModulesMap = new Map<string, string[]>();
        (modalitiesData || []).forEach(item => {
          if (!sessionModulesMap.has(item.session_id)) {
            sessionModulesMap.set(item.session_id, []);
          }
          sessionModulesMap.get(item.session_id)!.push(item.modality);
        });

        // 5. Batch fetch session details for all unique sessions (1 query)
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('id, title, duration_min, technique, description, why_it_works, audio_url, thumbnail_url, is_active')
          .in('id', uniqueSessionIds)
          .eq('is_active', true);

        if (sessionsError) {
          console.error('Error fetching sessions:', sessionsError);
          setFetchedCompletedSessions([]);
          return;
        }

        // 6. Create a map: session_id -> session details
        const sessionsMap = new Map<string, any>();
        (sessionsData || []).forEach(session => {
          sessionsMap.set(session.id, {
            id: session.id,
            title: session.title,
            durationMin: session.duration_min,
            modality: session.technique,
            goal: 'anxiety' as any,
            description: session.description || undefined,
            whyItWorks: session.why_it_works || undefined,
            isRecommended: false,
            isTutorial: false,
          });
        });

        // 7. Filter: Include sessions that belong to current module (based on session_modalities)
        // Use completed_date from completed_sessions for dates
        const moduleCompletedSessions: CompletedMeditation[] = [];
        const seenKeys = new Set<string>(); // Track seen keys to prevent duplicates

        for (const cs of completedSessionsData) {
          const sessionModules = sessionModulesMap.get(cs.session_id) || [];

          // Count this session if it belongs to the current module
          if (sessionModules.includes(module.id)) {
            const session = sessionsMap.get(cs.session_id);
            if (session) {
              // Create a unique key - use cs.id if available, otherwise combine session_id, completed_date, and created_at for uniqueness
              const uniqueKey = cs.id || `${module.id}-completed-${cs.session_id}-${cs.completed_date}-${cs.created_at || Date.now()}`;

              // Skip if we've already added this exact completion
              if (!seenKeys.has(uniqueKey)) {
                seenKeys.add(uniqueKey);
                moduleCompletedSessions.push({
                  id: uniqueKey,
                  session: session,
                  completedDate: new Date(cs.completed_date || cs.created_at || Date.now()),
                });
              }
            }
          }
        }

        // 8. Sort by completed_date (most recent first)
        moduleCompletedSessions.sort((a, b) => b.completedDate.getTime() - a.completedDate.getTime());

        setFetchedCompletedSessions(moduleCompletedSessions);
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
      panic: ['anxiety'],
      stress: ['anxiety', 'focus'],
      sleep: ['sleep'],
      focus: ['focus'],
      mindfulness: ['focus', 'sleep'],
      'self-compassion': ['sleep', 'focus'],
      burnout: ['stress', 'sleep'],
      addiction: ['anxiety', 'focus'],
    };

    // Use all fetched completed sessions from database for counting (already sorted with most recent first)
    const completedSessions = fetchedCompletedSessions;

    // Limit to 6 most recent for display purposes only
    const displaySessions = fetchedCompletedSessions.slice(0, 6);

    // For tomorrow session, we can keep using a placeholder from mock data for now
    const goals = relevantGoals[module.id as keyof typeof relevantGoals] || ['focus'];
    const moduleSessions = mockSessions.filter(session => goals.includes(session.goal));
    const tomorrowCandidate = moduleSessions[0];

    const tomorrowSession = tomorrowCandidate
      ? {
          ...tomorrowCandidate,
          id: `${tomorrowCandidate.id}-tomorrow`,
        }
      : undefined;

    return {
      completedSessions,
      displaySessions,
      tomorrowSession,
    };
  }, [module, fetchedCompletedSessions]);

  const { completedSessions, displaySessions, tomorrowSession } = roadmapData;
  // Use the recommended session passed as prop (from TodayScreen)
  const todayRecommendedSessionId = recommendedSession?.id;

  // Calculate number of sessions completed today
  const todayCount = useMemo(() => {
    const today = new Date();
    return completedSessions.filter(item => {
      return item.completedDate.toDateString() === today.toDateString();
    }).length;
  }, [completedSessions]);

  // Filter to only count one session per day for neuroadaptation
  // We only need the count, so we just track unique dates
  const uniqueDailySessionsCount = useMemo(() => {
    const seenDates = new Set<string>();

    for (const session of completedSessions) {
      const dateKey = session.completedDate.toDateString();
      seenDates.add(dateKey);
    }

    return seenDates.size;
  }, [completedSessions]);

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

  useEffect(() => {
    // Pulse animation for scroll arrow (scale)
    const pulseArrow = () => {
      Animated.sequence([
        Animated.timing(scrollArrowScale, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scrollArrowScale, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(() => pulseArrow());
    };

    pulseArrow();
    return () => {
      scrollArrowScale.stopAnimation();
    };
  }, [scrollArrowScale]);

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

    if (completedSessions.length === 0) {
      return null;
    }

    return (
      <View
        style={styles.section}
        onLayout={event => {
          completedSectionY.current = event.nativeEvent.layout.y;
        }}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Recent</Text>
        </View>
        <View style={[styles.recentListCard, { backgroundColor: theme.colors.surface, shadowOpacity: theme.isDark ? 0.3 : 0.06 }]}>
          {displaySessions.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.recentListItem,
                index < displaySessions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
              ]}
              onPress={() => navigation.navigate('MeditationDetail', { sessionId: item.session.id })}
              activeOpacity={0.7}
            >
              <View style={[styles.recentListIcon, { backgroundColor: theme.colors.success + '18' }]}>
                <Text style={[styles.recentListIconText, { color: theme.colors.success }]}>✓</Text>
              </View>
              <View style={styles.recentListContent}>
                <Text style={[styles.recentListTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
                  {item.session.title}
                </Text>
                <Text style={[styles.recentListMeta, { color: theme.colors.text.tertiary }]}>
                  {item.session.durationMin} min · {item.session.modality}
                </Text>
              </View>
              <Text style={[styles.recentListDate, { color: theme.colors.text.tertiary }]}>
                {formatDate(item.completedDate)}
              </Text>
            </TouchableOpacity>
          ))}
          {completedSessions.length > 6 && (
            <View style={[styles.recentListFooter, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border }]}>
              <Text style={[styles.recentListFooterText, { color: theme.colors.text.tertiary }]}>
                {completedSessions.length - 6} more sessions
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTodayPlan = () => {
    if (!recommendedSession) {
      return null;
    }

    const isCompleted = isSessionCompletedToday(module.id, recommendedSession.id) || todayCompleted;

    return (
      <View
        style={styles.section}
        onLayout={event => {
          todaySectionY.current = event.nativeEvent.layout.y;
        }}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Recommended Today
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('MeditationDetail', { sessionId: recommendedSession.id })}
          activeOpacity={0.85}
          style={[
            styles.todayCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: isCompleted ? theme.colors.success + '40' : module.color + '40',
              shadowOpacity: theme.isDark ? 0.3 : 0.08,
            },
          ]}
        >
          <View style={styles.todayCardContentWrapper}>
            <View style={[styles.todayAccentBar, { backgroundColor: isCompleted ? theme.colors.success : module.color }]} />
            <View style={styles.todayCardTextSection}>
              <Text
                style={[styles.todayCardTitle, { color: isCompleted ? theme.colors.text.tertiary : theme.colors.text.primary }]}
                numberOfLines={2}
              >
                {recommendedSession.title}
              </Text>
              <Text style={[styles.todayCardDuration, { color: isCompleted ? theme.colors.text.tertiary : theme.colors.text.secondary }]}>
                {recommendedSession.durationMin} min · {recommendedSession.modality}
              </Text>
            </View>

            {isCompleted ? (
              <View style={[styles.todayCompletedButton, { backgroundColor: theme.colors.success }]}>
                <Text style={styles.todayCompletedCheckmark}>✓</Text>
              </View>
            ) : (
              <View style={[styles.todayPlayButton, { backgroundColor: module.color }]}>
                <Text style={styles.todayPlayIcon}>▶</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
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
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Tomorrow</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>Finish today's meditation to unlock</Text>
          </View>
          <View style={[styles.tomorrowCard, styles.tomorrowCardLocked, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceTertiary }]}>
            <View style={styles.tomorrowHeader}>
              <View style={[styles.tomorrowIcon, styles.tomorrowIconLocked, { backgroundColor: theme.colors.surfaceTertiary }]}>
                <Text style={styles.tomorrowIconText}>🔒</Text>
              </View>
              <View style={styles.tomorrowLockedContent}>
                <Text style={[styles.tomorrowLockedTitle, { color: theme.colors.text.secondary }]}>Feature coming soon</Text>
                <Text style={[styles.tomorrowLockedDescription, { color: theme.colors.text.secondary }]}>
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
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Tomorrow</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>Preview of what's coming next</Text>
        </View>
        <View style={[styles.tomorrowCard, styles.tomorrowCardLocked, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceTertiary }]}>
          <View style={styles.tomorrowHeader}>
            <View style={[styles.tomorrowIcon, styles.tomorrowIconLocked, { backgroundColor: theme.colors.surfaceTertiary }]}>
              <Text style={styles.tomorrowIconText}>🔒</Text>
            </View>
            <View style={styles.tomorrowLockedContent}>
              <Text style={[styles.tomorrowLockedTitle, { color: theme.colors.text.secondary }]}>Feature coming soon</Text>
              <Text style={[styles.tomorrowLockedDescription, { color: theme.colors.text.secondary }]}>
                Complete today's sessions to see what's coming next
              </Text>
            </View>
          </View>
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
    // Use filtered count (one per day) for neuroadaptation progress
    const totalSessions = uniqueDailySessionsCount;

    // Calculate average sessions required based on time ranges
    // 5-7 daily sessions: (5+7)/2 = 6
    // 3-4 weeks of daily sessions: (3*7 + 4*7)/2 = (21+28)/2 = 24.5, rounded to 25
    // 6-8 Weeks of daily sessions: (6*7 + 8*7)/2 = (42+56)/2 = 49
    // 3 Months of daily sessions: 3 * 30.44 = 91.32, rounded to 91
    // 6 Months of daily sessions: 6 * 30.44 = 182.64, rounded to 183
    // 1 Year of daily sessions: 365

    // Calculate progress for each milestone based on sessions completed
    const milestones = [
      {
        id: 'week1',
        title: 'Reduced amygdala activity',
        timeRange: '5-7 daily sessions',
        sessionsRequired: Math.round((5 + 7) / 2), // 6
        description: 'Lower acute stress reactivity. Heart rate decreases, parasympathetic activation increases. Improved attention for short periods.',
        whatYouFeel: 'Slight calm after sessions, more aware of anxious thoughts, some restlessness (very normal at start)',
      },
      {
        id: 'weeks2-4',
        title: 'Increased prefrontal cortex regulation',
        timeRange: '3-4 weeks of daily sessions',
        sessionsRequired: Math.round((3 * 7 + 4 * 7) / 2), // 25
        description: 'Better impulse control & emotional regulation. Reduced cortisol baseline levels. Thicker hippocampal gray matter begins.',
        whatYouFeel: 'Anxiety decreases slightly but consistently, better sleep onset, you notice reactions before they happen, mood is more stable',
      },
      {
        id: 'weeks6-8',
        title: 'Amygdala density reduction',
        timeRange: '6–8 Weeks of daily sessions',
        sessionsRequired: Math.round((6 * 7 + 8 * 7) / 2), // 49
        description: 'Amygdala shrinks in density. Hippocampus increases (memory + learning). Default Mode Network activity decreases → Less rumination.',
        whatYouFeel: 'Noticeably lower anxiety baseline, stress hits you less intensely, emotional resilience increases, mind wandering drops',
      },
      {
        id: '3months',
        title: 'Stronger frontal-limbic connectivity',
        timeRange: '3 Months of daily sessions',
        sessionsRequired: Math.round(3 * 30.44), // 91
        description: 'You regulate emotions automatically. Significant improvements in working memory. Lower blood pressure in many adults.',
        whatYouFeel: 'Anxiety triggers don\'t hit as hard, you handle conflict more smoothly, you recover from stress much faster',
      },
      {
        id: '6months',
        title: 'Permanent structural changes',
        timeRange: '6 Months of daily sessions',
        sessionsRequired: Math.round(6 * 30.44), // 183
        description: 'Permanent structural changes in prefrontal cortex, anterior cingulate cortex, and insula. DMN quieting becomes your default.',
        whatYouFeel: 'Overall anxiety level drops 30–40% on average, you begin feeling "centered" most days, your mind feels clearer',
      },
      {
        id: '1year',
        title: 'Deep neural transformation',
        timeRange: '1 Year of daily sessions',
        sessionsRequired: 365,
        description: 'Gamma-wave activity increases. Massive increases in cortical thickness. Stronger white-matter pathways for emotional regulation.',
        whatYouFeel: 'Deep, stable calm under most conditions, fast recovery from stress, very strong "observer mind" — thoughts don\'t control you anymore',
      },
    ];

    // Find the first milestone that isn't unlocked yet — that's the "active" one
    const activeIndex = milestones.findIndex(
      (m) => totalSessions < m.sessionsRequired
    );

    return (
      <ScrollView
        style={[styles.page, { width: screenWidth }]}
        contentContainerStyle={styles.timelinePageContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timelineContainer}>
          {/* Summary chip */}
          {!isLoadingSessions && (
            <View style={[styles.timelineSummary, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
              <Text style={[styles.timelineSummaryText, { color: theme.colors.text.secondary }]}>
                <Text style={{ color: module.color, fontWeight: '700' }}>{totalSessions}</Text> daily session{totalSessions !== 1 ? 's' : ''} completed
              </Text>
            </View>
          )}

          {isLoadingSessions ? (
            <>
              <ShimmerNeuroadaptationCard />
              <ShimmerNeuroadaptationCard />
              <ShimmerNeuroadaptationCard />
              <ShimmerNeuroadaptationCard />
              <ShimmerNeuroadaptationCard />
              <ShimmerNeuroadaptationCard />
            </>
          ) : (
            milestones.map((milestone, index) => {
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
                  isActive={index === activeIndex}
                  isLast={index === milestones.length - 1}
                />
              );
            })
          )}
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
        {/* Inline stats */}
        <View style={styles.overviewStatsRow}>
          <View style={[styles.overviewStatChip, { backgroundColor: module.color + '18' }]}>
            <Text style={[styles.overviewStatValue, { color: module.color }]}>{completedSessions.length}</Text>
            <Text style={[styles.overviewStatLabel, { color: theme.colors.text.secondary }]}>completed</Text>
          </View>
          <View style={[styles.overviewStatChip, { backgroundColor: theme.colors.success + '18' }]}>
            <Text style={[styles.overviewStatValue, { color: theme.colors.success }]}>{todayCount}</Text>
            <Text style={[styles.overviewStatLabel, { color: theme.colors.text.secondary }]}>today</Text>
          </View>
        </View>

        {renderTodayPlan()}
        {renderCompletedMeditations()}
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* Sticky Header */}
        <View style={[styles.stickyHeader, { backgroundColor: theme.colors.glass.background, borderBottomColor: theme.colors.border, shadowOpacity: theme.isDark ? 0.3 : 0.06 }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackPress || (() => navigation.goBack())}
            >
              <Text style={[styles.backButtonText, { color: theme.colors.accent }]}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]} numberOfLines={1} ellipsizeMode="tail">{titleText}</Text>
            <View style={styles.headerActions} />
          </View>

          {/* Tabs in Header */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'timeline' && styles.activeTab]}
              onPress={() => handleTabChange('timeline')}
            >
              <Text style={[styles.tabText, { color: theme.colors.text.secondary }, activeTab === 'timeline' && { color: theme.colors.accent, fontWeight: '600' }]}>
                Neuroadaptation
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
              onPress={() => handleTabChange('overview')}
            >
              <Text style={[styles.tabText, { color: theme.colors.text.secondary }, activeTab === 'overview' && { color: theme.colors.accent, fontWeight: '600' }]}>
                Overview
              </Text>
            </TouchableOpacity>

            {/* Animated Indicator */}
            <Animated.View
              style={[
                styles.tabIndicator,
                { backgroundColor: theme.colors.accent },
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
  },
  safeArea: {
    flex: 1,
  },
  stickyHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 100,
    paddingTop: 52, // Status bar height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
    fontSize: 24,
    fontWeight: '400',
  },
  headerTitle: {
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
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
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
  overviewStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  overviewStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  overviewStatValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  overviewStatLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  recentListCard: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  recentListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  recentListIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentListIconText: {
    fontSize: 14,
    fontWeight: '700',
  },
  recentListContent: {
    flex: 1,
    marginRight: 8,
  },
  recentListTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  recentListMeta: {
    fontSize: 12,
  },
  recentListDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  recentListFooter: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  recentListFooterText: {
    fontSize: 12,
    fontWeight: '500',
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
    fontFamily: 'System',
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 14,
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
    right: -22,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollArrowText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 32,
    marginLeft: 2,
  },
  completedCardWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  completedCard: {
    borderRadius: 12,
    padding: 8,
    width: 160,
    height: 120,
    borderWidth: 1,
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
    lineHeight: 19,
    marginBottom: 2,
    fontFamily: 'System',
  },
  completedMeta: {
    fontSize: 12,
    marginBottom: 2,
    fontFamily: 'System',
  },
  completedDate: {
    fontSize: 12,
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
    borderRadius: 14,
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  todayAccentBar: {
    width: 4,
    borderRadius: 2,
    alignSelf: 'stretch',
    marginRight: 14,
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
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  todayCardContentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  todayCardTextSection: {
    flex: 1,
    marginRight: 12,
  },
  todayCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  todayCardDuration: {
    fontSize: 13,
  },
  recommendedBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  todayCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 0,
    paddingTop: 0,
  },
  todayCardFooterCompleted: {
    justifyContent: 'flex-start',
    borderTopWidth: 0,
    paddingTop: 0,
  },
  todayCardCompletedText: {
    fontSize: 14,
    fontWeight: '400',
    fontStyle: 'italic',
    letterSpacing: -0.2,
  },
  todayCardCTA: {
    fontSize: 14,
    fontWeight: '400',
    fontStyle: 'italic',
    letterSpacing: -0.2,
  },
  todayPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayPlayIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 2,
  },
  todayCompletedButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCompletedCheckmark: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  tomorrowCard: {
    borderRadius: 18,
    padding: 18,
    paddingVertical: 24,
    borderWidth: 1,
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
    fontFamily: 'System',
  },
  tomorrowTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'System',
  },
  tomorrowMeta: {
    fontSize: 13,
    marginBottom: 10,
    fontFamily: 'System',
  },
  tomorrowDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'System',
  },
  tomorrowCardLocked: {
    opacity: 0.6,
    borderStyle: 'dashed',
    justifyContent: 'center',
    minHeight: 100,
  },
  tomorrowIconLocked: {
    // background color set via inline style using theme token
  },
  tomorrowLockedContent: {
    flex: 1,
  },
  tomorrowLockedTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
  },
  tomorrowLockedDescription: {
    fontSize: 14,
    lineHeight: 20,
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
    marginBottom: 8,
    fontFamily: 'System',
  },
  timelineSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
    fontFamily: 'System',
  },
  timelineStats: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    marginRight: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'System',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'System',
  },
  // ── Timeline row (node + content side by side) ──
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineLeftColumn: {
    width: 32,
    alignItems: 'center',
    marginRight: 16,
  },
  timelineNodeComplete: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineNodeCheck: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timelineNodeActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineNodeActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineNodeLocked: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 28,
  },
  timelineMilestoneHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  timelineHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  timelineChevronBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineExpandedContent: {
    marginTop: 10,
  },
  timelineMilestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    flex: 1,
  },
  timelineProgressChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 1,
  },
  timelineProgressChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  timelineMilestoneTime: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },
  timelineProgressBarWrap: {
    marginTop: 10,
    marginBottom: 2,
  },
  timelineProgressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timelineProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timelineMilestoneDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  timelineFeelBox: {
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
  },
  timelineFeelLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  timelineFeelText: {
    fontSize: 13,
    lineHeight: 19,
  },
  timelineSessionsLeft: {
    fontSize: 13,
    marginTop: 4,
  },
  timelineSummary: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 20,
    marginLeft: 48,
  },
  timelineSummaryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  placeholderCard: {
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
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
