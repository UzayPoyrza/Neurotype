import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, TouchableOpacity, FlatList, AccessibilityInfo, TouchableWithoutFeedback } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Session } from '../types';
import { useStore, prerenderedModuleBackgrounds, createCompletionBackground } from '../store/useStore';
import { mockSessions } from '../data/mockData';
import { mentalHealthModules } from '../data/modules';
import { theme } from '../styles/theme';
import { ModuleGridModal } from '../components/ModuleGridModal';
import { AnimatedFloatingButton } from '../components/AnimatedFloatingButton';
import { SessionBottomSheet } from '../components/SessionBottomSheet';
import { SessionProgressView } from '../components/SessionProgressView';
import { SessionRating } from '../components/SessionRating';
import { InfoBox } from '../components/InfoBox';
import { MeditationDetailModal } from '../components/MeditationDetailModal';
import { MergedCard } from '../components/MergedCard';
import { LineGraphIcon } from '../components/icons/LineGraphIcon';

type SessionState = 'not_started' | 'in_progress' | 'completed' | 'rating';

type TodayStackParamList = {
  TodayMain: undefined;
  Roadmap: undefined;
  MeditationDetail: { sessionId: string };
  Player: undefined;
};

type TodayScreenNavigationProp = StackNavigationProp<TodayStackParamList, 'TodayMain'>;

export const TodayScreen: React.FC = () => {
  const navigation = useNavigation<TodayScreenNavigationProp>();
  const { setActiveSession, setGlobalBackgroundColor, setCurrentScreen, setTodayModuleId, markSessionCompletedToday, isSessionCompletedToday } = useStore();
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  const userProgress = useStore(state => state.userProgress);
  
  // Module and session state management
  const [selectedModuleId, setSelectedModuleId] = useState('anxiety'); // Default to anxiety
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>('not_started');
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showMeditationModal, setShowMeditationModal] = useState(false);
  const [todayCompleted, setTodayCompleted] = useState(false);
  const [triggerUnlock, setTriggerUnlock] = useState(false);
  const [showRecommendationInfo, setShowRecommendationInfo] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isPillMode, setIsPillMode] = useState(false);
  const [lastFocusTime, setLastFocusTime] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [showInfoBox, setShowInfoBox] = useState(false);
  const [infoButtonActive, setInfoButtonActive] = useState(false);
  
  // Animation refs - simplified to avoid native driver conflicts
  const heroCardScale = useRef(new Animated.Value(1)).current;
  const completionAnimation = useRef(new Animated.Value(0)).current;
  const unlockAnimation = useRef(new Animated.Value(0)).current;
  const roadmapCardScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const moduleButtonFade = useRef(new Animated.Value(1)).current;
  
  const selectedModule = mentalHealthModules.find(m => m.id === selectedModuleId) || mentalHealthModules[0];
  
  // Update global background color when module changes
  useEffect(() => {
    const subtleColor = prerenderedModuleBackgrounds[selectedModuleId] || prerenderedModuleBackgrounds['anxiety'];
    setGlobalBackgroundColor(subtleColor);
    setTodayModuleId(selectedModuleId);
  }, [selectedModuleId, setGlobalBackgroundColor, setTodayModuleId]);

  // Set screen context when component mounts or updates
  useEffect(() => {
    setCurrentScreen('today');
  }, [setCurrentScreen]);

  // Robust pill trigger function with delay
  const triggerPillAnimation = useCallback(() => {
    const currentTime = Date.now();
    
    // Prevent rapid successive triggers (debounce)
    if (currentTime - lastFocusTime < 500) {
      return;
    }
    
    setLastFocusTime(currentTime);
    setIsPillMode(false);
    
    // Start timer for pill mode
    const timer = setTimeout(() => {
      setIsPillMode(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [lastFocusTime]);

  // Immediate pill trigger function for scroll events
  const triggerPillAnimationImmediate = useCallback(() => {
    const currentTime = Date.now();
    
    // Prevent rapid successive triggers (debounce)
    if (currentTime - lastFocusTime < 500) {
      return;
    }
    
    setLastFocusTime(currentTime);
    setIsPillMode(false);
    
    // Trigger pill mode immediately
    setIsPillMode(true);
  }, [lastFocusTime]);

  // Handle drag start - cancel pill animation
  const handleDragStart = useCallback(() => {
    setIsPillMode(false);
  }, []);

  // Pill mode logic - trigger when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      triggerPillAnimation();
    }, [triggerPillAnimation])
  );

  // Trigger pill animation on focus
  useEffect(() => {
    triggerPillAnimation();
  }, [triggerPillAnimation]);

  // Auto-hide pill after 3 seconds
  useEffect(() => {
    if (isPillMode) {
      const timer = setTimeout(() => {
        setIsPillMode(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isPillMode]);

  // Note: Scroll-down pill hiding is now handled immediately in the scroll handler

  
  // Generate adaptive sessions based on module and progress
  const getTodaySessions = () => {
    const relevantGoals = {
      'anxiety': ['anxiety'],
      'adhd': ['focus'],
      'depression': ['sleep', 'focus'],
      'bipolar': ['anxiety', 'sleep'],
      'panic': ['anxiety'],
      'ptsd': ['anxiety', 'sleep'],
      'stress': ['anxiety', 'focus'],
      'sleep': ['sleep'],
      'focus': ['focus'],
      'emotional-regulation': ['anxiety', 'focus'],
      'mindfulness': ['focus', 'sleep'],
      'self-compassion': ['sleep', 'focus'],
    };
    
    const goals = relevantGoals[selectedModule.id as keyof typeof relevantGoals] || ['focus'];
    const moduleSessions = mockSessions.filter(session => goals.includes(session.goal));
    
    // Return up to four sessions with one marked as recommended
    return moduleSessions.slice(0, 4).map((session, index) => ({
      ...session,
      id: `${session.id}-today`,
      isRecommended: index === 0,
      adaptiveReason: index === 0 ? 'Based on your recent progress' : 'Alternative option'
    }));
  };

  const todaySessions = getTodaySessions();
  const recommendedSession = todaySessions.find(s => s.isRecommended) || todaySessions[0];
  
  // Check if recommended session is completed
  const isRecommendedCompleted = isSessionCompletedToday(
    selectedModuleId, 
    recommendedSession.id.replace('-today', '')
  );
  
  // Get subtle completion background color that works with module color
  const completionBackgroundColor = createCompletionBackground(
    selectedModule.color,
    globalBackgroundColor
  );

  const moduleSessionsForRoadmap = useMemo(() => {
    const relevantGoals = {
      'anxiety': ['anxiety'],
      'adhd': ['focus'],
      'depression': ['sleep', 'focus'],
      'bipolar': ['anxiety', 'sleep'],
      'panic': ['anxiety'],
      'ptsd': ['anxiety', 'sleep'],
      'stress': ['anxiety', 'focus'],
      'sleep': ['sleep'],
      'focus': ['focus'],
      'emotional-regulation': ['anxiety', 'focus'],
      'mindfulness': ['focus', 'sleep'],
      'self-compassion': ['sleep', 'focus'],
    };

    const goals = relevantGoals[selectedModule.id as keyof typeof relevantGoals] || ['focus'];
    return mockSessions.filter(session => goals.includes(session.goal));
  }, [selectedModule]);

  // Get actual completed sessions for this module from user progress
  const completedPreviewSessions = useMemo(() => {
    const moduleCompletedSessions = userProgress.sessionDeltas
      .filter(delta => delta.moduleId === selectedModuleId)
      .map(delta => {
        const session = mockSessions.find(s => s.id === delta.sessionId);
        return session ? { ...session, completedDate: delta.date } : null;
      })
      .filter((session): session is NonNullable<typeof session> => session !== null)
      .slice(0, 3);
    
    return moduleCompletedSessions;
  }, [userProgress.sessionDeltas, selectedModuleId]);

  const upcomingPreviewSessions = useMemo(() => {
    const todayIds = todaySessions.map(session => session.id.replace('-today', ''));
    return moduleSessionsForRoadmap
      .filter(session => !todayIds.includes(session.id))
      .slice(0, 2);
  }, [moduleSessionsForRoadmap, todaySessions]);
  
  // Check if today's meditation is completed
  const isTodayCompleted = useMemo(() => {
    return todaySessions.some(session => {
      const originalSessionId = session.id.replace('-today', '');
      return isSessionCompletedToday(selectedModuleId, originalSessionId);
    });
  }, [todaySessions, selectedModuleId, isSessionCompletedToday]);

  // Calculate timeline progress for preview
  const timelineProgress = useMemo(() => {
    const totalSessions = userProgress.sessionDeltas.length;
    
    const milestones = [
      { sessionsRequired: 7, timeRange: '0–1 Week' },
      { sessionsRequired: 28, timeRange: '2–4 Weeks' },
      { sessionsRequired: 56, timeRange: '6–8 Weeks' },
      { sessionsRequired: 90, timeRange: '3 Months' },
      { sessionsRequired: 180, timeRange: '6 Months' },
      { sessionsRequired: 365, timeRange: '1 Year' },
    ];
    
    // Find current milestone - the one the user is working towards
    let nextMilestone = milestones[0];
    let isCompleted = false;
    
    for (let i = 0; i < milestones.length; i++) {
      if (totalSessions < milestones[i].sessionsRequired) {
        nextMilestone = milestones[i];
        break;
      }
      // If we've completed all milestones, use the last one
      if (i === milestones.length - 1 && totalSessions >= milestones[i].sessionsRequired) {
        nextMilestone = milestones[i];
        isCompleted = true;
      }
    }
    
    const progress = isCompleted 
      ? 100 
      : Math.min(100, (totalSessions / nextMilestone.sessionsRequired) * 100);
    const sessionsRemaining = isCompleted 
      ? 0 
      : Math.max(0, nextMilestone.sessionsRequired - totalSessions);
    
    return {
      totalSessions,
      nextMilestone,
      progress,
      sessionsRemaining,
    };
  }, [userProgress]);

  const formatCompletedLabel = useCallback((index: number) => {
    if (index === 0) return 'Yesterday';
    if (index === 1) return '2 days ago';

    const date = new Date();
    date.setDate(date.getDate() - (index + 1));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  const handleSessionSelect = (session: Session) => {
    setSelectedSession(session);
    
    // Remove the -today suffix to get the original session ID
    const originalSessionId = session.id.replace('-today', '');
    
    // Navigate to the new meditation detail screen
    navigation.navigate('MeditationDetail', { sessionId: originalSessionId });
  };

  const handleStartSession = () => {
    setShowMeditationModal(false);
    setSessionState('in_progress');
    if (selectedSession) {
      setActiveSession(selectedSession);
    }
  };

  const handleCloseMeditationModal = () => {
    setShowMeditationModal(false);
  };

  const handleTutorial = () => {
    // TODO: Implement tutorial functionality
    console.log('Tutorial requested for:', selectedSession?.title);
  };

  const handleSessionFinish = () => {
    setSessionState('rating');
  };

  const handleRatingSubmit = (rating: number) => {
    // Mark session as completed in store
    if (selectedSession) {
      const originalSessionId = selectedSession.id.replace('-today', '');
      markSessionCompletedToday(selectedModuleId, originalSessionId);
    }
    
    // Mark today as completed and trigger unlock animation
    setTodayCompleted(true);
    setTriggerUnlock(true);
    setSessionState('completed');
    setSelectedSession(null);
    
    // Trigger completion and unlock animations
    triggerCompletionAnimation();
    setTimeout(() => {
      triggerUnlockAnimationSequence();
    }, 300);
    
    // Accessibility announcement
    AccessibilityInfo.announceForAccessibility('Session completed. Tomorrow unlocked.');
    
    // Here you would typically save the rating to your store/backend
    console.log('Session rated:', rating);
  };

  const handleUnlockComplete = () => {
    setTriggerUnlock(false);
  };

  // Roadmap card press animations
  const handleRoadmapCardPressIn = () => {
    Animated.timing(roadmapCardScale, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handleRoadmapCardPressOut = () => {
    Animated.timing(roadmapCardScale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handleRoadmapCardPress = () => {
    // Very quick scale down, then expand animation
    Animated.sequence([
      Animated.timing(roadmapCardScale, {
        toValue: 0.95,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(roadmapCardScale, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('Roadmap' as never);
      // Reset scale after navigation
      roadmapCardScale.setValue(1);
    });
  };

  const handleCancel = () => {
    setSelectedSession(null);
    setShowBottomSheet(false);
    setSessionState('not_started');
  };

  // Handle info box display
  const handleInfoPress = () => {
    setShowInfoBox(true);
    setInfoButtonActive(true);
  };

  const handleCloseInfoBox = () => {
    setShowInfoBox(false);
    setInfoButtonActive(false);
  };

  // Handle module button press with fade animation
  const handleModuleButtonPress = () => {
    // Quick fade out, then fade back in
    Animated.sequence([
      Animated.timing(moduleButtonFade, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(moduleButtonFade, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowModuleModal(true);
    });
  };

  // Hero card press animations - simplified to avoid conflicts
  const handleHeroCardPressIn = () => {
    Animated.timing(heroCardScale, {
      toValue: 0.98,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handleHeroCardPressOut = () => {
    Animated.timing(heroCardScale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  // Session completion animation
  const triggerCompletionAnimation = () => {
    Animated.sequence([
      Animated.timing(completionAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(completionAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Tomorrow unlock animation
  const triggerUnlockAnimationSequence = () => {
    Animated.timing(unlockAnimation, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  // Render based on current state
  if (sessionState === 'in_progress' && selectedSession) {
    return (
      <SessionProgressView
        session={selectedSession}
        onFinish={handleSessionFinish}
        onCancel={handleCancel}
      />
    );
  }

  if (sessionState === 'rating' && selectedSession) {
    return (
      <SessionRating
        onSubmit={handleRatingSubmit}
        onCancel={handleCancel}
      />
    );
  }

  // Get current date info
  const getCurrentDateInfo = () => {
    const today = new Date();
    return {
      dayName: today.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: today.getDate(),
      monthName: today.toLocaleDateString('en-US', { month: 'short' }),
      fullDate: today.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })
    };
  };

  const renderTodayView = () => (
    <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
      {/* Sticky Header */}
      <View style={[styles.stickyHeader, { backgroundColor: globalBackgroundColor }]}>
        <Text style={styles.title}>Today</Text>
        
        {/* Info Button */}
        <View style={styles.infoWrapper}>
          <TouchableOpacity 
            style={[styles.infoButton, infoButtonActive && styles.infoButtonActive]}
            onPress={handleInfoPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.infoButtonText, infoButtonActive && styles.infoButtonTextActive]}>i</Text>
          </TouchableOpacity>
          
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        onScroll={(event) => {
          const currentScrollY = event.nativeEvent.contentOffset.y;
          setScrollY(currentScrollY);
          
          // Calculate if user is near the bottom only when content is scrollable
          const hasScrollableContent = contentHeight > scrollViewHeight + 80;
          const isAtBottom = hasScrollableContent &&
            (currentScrollY + scrollViewHeight) >= (contentHeight - 50);
          
          // Track if user has reached the bottom (reset more quickly)
          if (isAtBottom && !hasReachedBottom) {
            setHasReachedBottom(true);
          } else if (currentScrollY < (contentHeight - scrollViewHeight - 100) && hasReachedBottom) {
            // Reset when user scrolls 100px away from bottom
            setHasReachedBottom(false);
          }
          
          // Force pill to close when user reaches bottom
          if (isAtBottom && isPillMode) {
            setIsPillMode(false);
          }
          
          // Allow pill to open when scrolling up, with more permissive conditions
          if (currentScrollY < lastScrollY && 
              currentScrollY > 50 && 
              !isPillMode && 
              !isAtBottom) {
            // User is scrolling up, not at the very top, not at bottom
            triggerPillAnimationImmediate();
          }
          
          // Detect scroll direction and hide pill immediately when scrolling down
          if (currentScrollY > lastScrollY && currentScrollY > 50 && isPillMode) {
            // User is scrolling down and has scrolled past 50px, hide pill immediately
            setIsPillMode(false);
          }
          
          setLastScrollY(currentScrollY);
        }}
        onContentSizeChange={(contentWidth, contentHeight) => {
          setContentHeight(contentHeight);
        }}
        onLayout={(event) => {
          setScrollViewHeight(event.nativeEvent.layout.height);
        }}
        scrollEventThrottle={16}
      >

        <MergedCard>
          <MergedCard.Section style={styles.mergedSectionTop}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>🧘‍♀️ Today's Focus</Text>
              <TouchableOpacity 
                style={styles.moduleButton}
                onPress={handleModuleButtonPress}
                activeOpacity={1}
              >
                <Animated.View style={{ opacity: moduleButtonFade, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.moduleIndicator, { backgroundColor: selectedModule.color }]} />
                  <Text style={styles.moduleButtonText}>{selectedModule.title}</Text>
                </Animated.View>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.focusSubtitle}>
              Personalized for your {selectedModule.title.toLowerCase()} journey
            </Text>

            {/* Recommended Session */}
            <Animated.View
              style={[
                styles.recommendedSessionContainer,
                {
                  transform: [{ scale: heroCardScale }],
                }
              ]}
            >
              <TouchableOpacity
                style={[styles.recommendedSession, { 
                  backgroundColor: (todayCompleted || isRecommendedCompleted) ? completionBackgroundColor : '#ffffff'
                }]}
                onPress={() => handleSessionSelect(recommendedSession)}
                onPressIn={handleHeroCardPressIn}
                onPressOut={handleHeroCardPressOut}
                activeOpacity={1}
              >
                <View style={styles.sessionContent}>
                  <Text style={styles.sessionTitle}>{recommendedSession.title}</Text>
                  <Text style={styles.sessionSubtitle}>
                    {recommendedSession.adaptiveReason || 'Recommended for you'}
                  </Text>
                  
                  <View style={styles.sessionMeta}>
                    <Text style={styles.sessionMetaText}>
                      {recommendedSession.durationMin} min • {recommendedSession.modality}
                    </Text>
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedBadgeText}>Recommended</Text>
                    </View>
                  </View>
                </View>

                {(todayCompleted || isRecommendedCompleted) ? (
                  <View style={[styles.sessionPlayButton, styles.sessionCompletedButton]}>
                    <Text style={styles.sessionCompletedCheckmark}>✓</Text>
                  </View>
                ) : (
                  <View style={[styles.sessionPlayButton, { backgroundColor: selectedModule.color }]}>
                    <Text style={styles.sessionPlayText}>▶</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </MergedCard.Section>

          <MergedCard.Section style={styles.mergedSectionList}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>💡 Other Options</Text>
            </View>
            
            <View style={styles.alternativeSessionsList}>
              {todaySessions.filter(s => !s.isRecommended).map((session) => {
                const originalSessionId = session.id.replace('-today', '');
                const isCompleted = isSessionCompletedToday(selectedModuleId, originalSessionId);
                
                return (
                  <TouchableOpacity
                    key={session.id}
                    style={[
                      styles.alternativeSession,
                      isCompleted && {
                        ...styles.alternativeSessionCompleted,
                        backgroundColor: completionBackgroundColor
                      }
                    ]}
                    onPress={() => handleSessionSelect(session)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.alternativeSessionContent}>
                      <Text style={[
                        styles.alternativeSessionTitle,
                        isCompleted && styles.alternativeSessionTitleCompleted
                      ]}>
                        {session.title}
                      </Text>
                      <Text style={styles.alternativeSessionMeta}>
                        {session.durationMin} min • {session.modality}
                      </Text>
                    </View>
                    {isCompleted ? (
                      <View style={[styles.alternativeSessionPlayButton, styles.alternativeSessionCompletedButton]}>
                        <Text style={styles.alternativeSessionCompletedCheckmark}>✓</Text>
                      </View>
                    ) : (
                      <View style={styles.alternativeSessionPlayButton}>
                        <Text style={styles.alternativeSessionPlayTextUncompleted}>▶</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </MergedCard.Section>
        </MergedCard>

        {/* Progress Path Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🗺️ Progress Path</Text>
          </View>

          <Animated.View
            style={[
              styles.progressPreviewContainer,
              {
                transform: [{ scale: roadmapCardScale }],
              }
            ]}
          >
            <TouchableOpacity
              style={styles.progressPreviewCard}
              onPress={handleRoadmapCardPress}
              onPressIn={handleRoadmapCardPressIn}
              onPressOut={handleRoadmapCardPressOut}
              activeOpacity={1}
            >
              <View style={styles.progressPreviewHeader}>
                <View style={[styles.progressPreviewBadge, { backgroundColor: selectedModule.color }]}>
                  <LineGraphIcon size={24} color="#FFFFFF" accentColor="#FFFFFF" />
                </View>
                <View style={styles.progressPreviewHeaderText}>
                  <Text style={styles.progressPreviewTitle}>{selectedModule.title} Journey</Text>
                  <Text style={styles.progressPreviewSubtitle}>
                    See what you’ve completed and what’s next
                  </Text>
                </View>
              </View>

              <View style={styles.progressPreviewTimeline}>
                <View style={styles.progressPreviewColumn}>
                  <Text style={styles.progressPreviewSectionLabel}>Completed</Text>
                  {completedPreviewSessions.map((session, index) => {
                    // Calculate days ago from completion date
                    const completedDate = new Date((session as any).completedDate);
                    const today = new Date();
                    const daysDiff = Math.floor((today.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
                    
                    let dateLabel: string;
                    if (daysDiff === 0) {
                      dateLabel = 'Today';
                    } else if (daysDiff === 1) {
                      dateLabel = 'Yesterday';
                    } else if (daysDiff === 2) {
                      dateLabel = '2 days ago';
                    } else {
                      dateLabel = completedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }
                    
                    return (
                      <View key={session.id} style={styles.progressPreviewItem}>
                        <View style={styles.progressPreviewItemIcon}>
                          <Text style={styles.progressPreviewItemIconText}>✓</Text>
                        </View>
                        <View style={styles.progressPreviewItemBody}>
                          <Text style={styles.progressPreviewItemTitle} numberOfLines={1}>
                            {session.title}
                          </Text>
                          <Text style={styles.progressPreviewItemMeta}>
                            {dateLabel}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                  {completedPreviewSessions.length === 0 && (
                    <View style={styles.progressPreviewLockedState}>
                      <View style={[styles.progressPreviewItemIcon, styles.progressPreviewItemIconLocked]}>
                        <Text style={styles.progressPreviewLockIconText}>🔒</Text>
                      </View>
                      <View style={styles.progressPreviewItemBody}>
                        <Text style={styles.progressPreviewLockedText}>
                          Complete a meditation to see it here
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.progressPreviewDivider} />

                <View style={styles.progressPreviewColumn}>
                  <Text style={styles.progressPreviewSectionLabel}>Coming Up</Text>
                  {!isTodayCompleted ? (
                    <View style={styles.progressPreviewLockedState}>
                      <View style={[styles.progressPreviewItemIcon, styles.progressPreviewItemIconLocked]}>
                        <Text style={styles.progressPreviewLockIconText}>🔒</Text>
                      </View>
                      <View style={styles.progressPreviewItemBody}>
                        <Text style={styles.progressPreviewLockedText}>
                          Finish today's meditation to preview tomorrow
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      {upcomingPreviewSessions.map(session => (
                        <View key={session.id} style={styles.progressPreviewItem}>
                          <View style={[styles.progressPreviewItemIcon, styles.progressPreviewItemIconUpcoming]}>
                            <Text style={[styles.progressPreviewItemIconText, styles.progressPreviewItemIconUpcomingText]}>▶</Text>
                          </View>
                          <View style={styles.progressPreviewItemBody}>
                            <Text style={styles.progressPreviewItemTitle} numberOfLines={1}>
                              {session.title}
                            </Text>
                            <Text style={styles.progressPreviewItemMeta}>
                              {session.durationMin} min • {session.modality}
                            </Text>
                          </View>
                        </View>
                      ))}
                      {upcomingPreviewSessions.length === 0 && (
                        <Text style={styles.progressPreviewLockedText}>Explore the roadmap for more</Text>
                      )}
                    </>
                  )}
                </View>
              </View>

              {/* Timeline Progress Preview */}
              <View style={styles.progressPreviewTimelineSection}>
                <View style={styles.progressPreviewTimelineHeader}>
                  <Text style={styles.progressPreviewTimelineLabel}>Neuroadaptation</Text>
                  <Text style={[styles.progressPreviewTimelineProgress, { color: selectedModule.color }]}>
                    {Math.round(timelineProgress.progress)}%
                  </Text>
                </View>
                <View style={styles.progressPreviewTimelineBarContainer}>
                  <View style={styles.progressPreviewTimelineBarTrack}>
                    <View 
                      style={[
                        styles.progressPreviewTimelineBarFill,
                        {
                          width: `${timelineProgress.progress}%`,
                          backgroundColor: selectedModule.color,
                        }
                      ]} 
                    />
                  </View>
                </View>
                <Text style={styles.progressPreviewTimelineText}>
                  {timelineProgress.sessionsRemaining > 0 
                    ? `${timelineProgress.sessionsRemaining} more sessions to ${timelineProgress.nextMilestone.timeRange}`
                    : `Completed ${timelineProgress.nextMilestone.timeRange} milestone`}
                </Text>
              </View>

              <View style={styles.progressPreviewFooter}>
                <Text style={styles.progressPreviewFooterText}>
                  Tap to open your full progress path
                </Text>
                <Text style={[styles.progressPreviewFooterArrow, { color: selectedModule.color }]}>›</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
        </ScrollView>
    </View>
  );

  return (
    <>
      {renderTodayView()}

      {/* Module Grid Modal */}
      <ModuleGridModal
        modules={mentalHealthModules}
        selectedModuleId={selectedModuleId}
        isVisible={showModuleModal}
        onModuleSelect={setSelectedModuleId}
        onClose={() => setShowModuleModal(false)}
      />

      {/* Session Bottom Sheet */}
      <SessionBottomSheet
        session={selectedSession}
        isVisible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        onStart={handleStartSession}
      />

      {/* Meditation Detail Modal */}
      <MeditationDetailModal
        session={selectedSession}
        isVisible={showMeditationModal}
        onClose={handleCloseMeditationModal}
        onStart={handleStartSession}
        onTutorial={handleTutorial}
      />

      {/* Animated Floating Button - Fixed to Screen */}
      <AnimatedFloatingButton
        backgroundColor={selectedModule.color}
        onPress={() => setShowModuleModal(true)}
        isPillMode={isPillMode}
        onScroll={(scrollY) => setScrollY(scrollY)}
        onDragStart={handleDragStart}
      />

      {/* Info Box */}
      <InfoBox
        isVisible={showInfoBox}
        onClose={handleCloseInfoBox}
        title="About Today"
        content="Our Today page uses evidence-based approaches to mental wellness. Each session is designed using proven techniques from cognitive behavioral therapy, mindfulness research, and neuroscience. Personalized recommendations adapt to your progress and preferences, helping you build sustainable mental health habits."
        position={{ top: 105, right: 20 }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  ...theme.health, // Use global Apple Health styles
  stickyHeader: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 5,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: 120, // Account for shorter sticky header height
  },
  moduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  moduleIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  moduleButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  recommendedBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  recommendedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  mergedSectionTop: {
    paddingTop: 0,
  },
  mergedSectionList: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  focusSubtitle: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  recommendedSessionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  recommendedSession: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  sessionContent: {
    flex: 1,
    marginRight: 16,
  },
  sessionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  sessionSubtitle: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  sessionMeta: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionMetaText: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '400',
  },
  sessionPlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionPlayText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  sessionCompletedButton: {
    backgroundColor: '#34c759',
  },
  sessionCompletedCheckmark: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  alternativeSessionsList: {
    paddingBottom: 20,
  },
  alternativeSession: {
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
  alternativeSessionCompleted: {
    borderColor: 'transparent',
  },
  alternativeSessionContent: {
    flex: 1,
    marginRight: 16,
  },
  alternativeSessionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  alternativeSessionTitleCompleted: {
    color: '#1d1d1f',
    opacity: 0.8,
  },
  alternativeSessionMeta: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '400',
  },
  alternativeSessionPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f2f2f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alternativeSessionPlayText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  alternativeSessionCompletedButton: {
    backgroundColor: '#34c759',
  },
  alternativeSessionCompletedCheckmark: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  alternativeSessionPlayTextUncompleted: {
    fontSize: 12,
    color: '#000000',
    fontWeight: 'bold',
    marginLeft: 1,
  },
  progressPreviewContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  progressPreviewCard: {
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
  progressPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressPreviewBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  progressPreviewHeaderText: {
    flex: 1,
  },
  progressPreviewTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  progressPreviewSubtitle: {
    fontSize: 14,
    color: '#8e8e93',
  },
  progressPreviewTimeline: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f2f2f7',
    backgroundColor: '#f9f9fb',
    paddingHorizontal: 14,
    paddingVertical: 18,
    marginBottom: 16,
  },
  progressPreviewColumn: {
    flex: 1,
  },
  progressPreviewSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  progressPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressPreviewItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#34c759',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  progressPreviewItemIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  progressPreviewLockIconText: {
    fontSize: 20,
  },
  progressPreviewItemBody: {
    flex: 1,
  },
  progressPreviewItemTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1d1d1f',
  },
  progressPreviewItemMeta: {
    fontSize: 12,
    color: '#8e8e93',
  },
  progressPreviewLockedState: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  progressPreviewItemIconLocked: {
    backgroundColor: '#f2f2f7',
    borderWidth: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  progressPreviewLockedText: {
    fontSize: 12,
    color: '#8e8e93',
    lineHeight: 16,
    marginTop: 2,
  },
  progressPreviewDivider: {
    width: 1,
    backgroundColor: '#e5e5ea',
    marginHorizontal: 12,
    borderRadius: 0.5,
  },
  progressPreviewItemIconUpcoming: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d1d6',
  },
  progressPreviewItemIconUpcomingText: {
    color: '#1d1d1f',
  },
  progressPreviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPreviewFooterText: {
    fontSize: 13,
    color: '#8e8e93',
    fontStyle: 'italic',
  },
  progressPreviewFooterArrow: {
    fontSize: 20,
    fontWeight: '600',
  },
  progressPreviewTimelineSection: {
    marginTop: 16,
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f2f2f7',
  },
  progressPreviewTimelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressPreviewTimelineLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  progressPreviewTimelineProgress: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressPreviewTimelineBarContainer: {
    marginBottom: 6,
  },
  progressPreviewTimelineBarTrack: {
    height: 6,
    backgroundColor: '#e5e5ea',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressPreviewTimelineBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPreviewTimelineText: {
    fontSize: 12,
    color: '#8e8e93',
  },
  bottomSpacing: {
    height: 120,
  },
  
  // Info Button & Box
  infoWrapper: {
    position: 'relative',
  },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
  },
  infoButtonActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  infoButtonTextActive: {
    color: '#007AFF',
  },
}); 