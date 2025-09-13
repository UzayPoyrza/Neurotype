import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, TouchableOpacity, FlatList, AccessibilityInfo, TouchableWithoutFeedback } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Session } from '../types';
import { useStore, prerenderedModuleBackgrounds } from '../store/useStore';
import { mockSessions } from '../data/mockData';
import { mentalHealthModules } from '../data/modules';
import { theme } from '../styles/theme';
import { ModuleGridModal } from '../components/ModuleGridModal';
import { AnimatedFloatingButton } from '../components/AnimatedFloatingButton';
import { SessionBottomSheet } from '../components/SessionBottomSheet';
import { SessionProgressView } from '../components/SessionProgressView';
import { SessionRating } from '../components/SessionRating';

type SessionState = 'not_started' | 'in_progress' | 'completed' | 'rating';

export const TodayScreen: React.FC = () => {
  const navigation = useNavigation();
  const { setActiveSession, setGlobalBackgroundColor, setCurrentScreen, setTodayModuleId } = useStore();
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  const userProgress = useStore(state => state.userProgress);
  
  // Module and session state management
  const [selectedModuleId, setSelectedModuleId] = useState('anxiety'); // Default to anxiety
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>('not_started');
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
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
    
    // Return 2-3 sessions with one marked as recommended
    return moduleSessions.slice(0, 3).map((session, index) => ({
      ...session,
      id: `${session.id}-today`,
      isRecommended: index === 0,
      adaptiveReason: index === 0 ? 'Based on your recent progress' : 'Alternative option'
    }));
  };

  const todaySessions = getTodaySessions();
  const recommendedSession = todaySessions.find(s => s.isRecommended) || todaySessions[0];

  const handleSessionSelect = (session: Session) => {
    setSelectedSession(session);
    setShowBottomSheet(true);
  };

  const handleStartSession = () => {
    setShowBottomSheet(false);
    setSessionState('in_progress');
    if (selectedSession) {
      setActiveSession(selectedSession);
    }
  };

  const handleSessionFinish = () => {
    setSessionState('rating');
  };

  const handleRatingSubmit = (rating: number) => {
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
    if (showInfoBox) {
      // Hide info box
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowInfoBox(false));
    } else {
      // Show info box
      setShowInfoBox(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  // Hide info box when tapping elsewhere
  const hideInfoBox = () => {
    if (showInfoBox) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowInfoBox(false));
    }
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

  // Subtle motivational messages based on progress
  const getMotivationalMessage = () => {
    const streak = userProgress?.streak || 0;
    if (streak === 0) return "Your journey begins today";
    if (streak === 1) return "Building your practice";
    if (streak < 7) return "Developing consistency";
    if (streak < 30) return "Strengthening your routine";
    return "Sustained mindful practice";
  };

  // Get calm accent color (teal instead of red)
  const getAccentColor = () => {
    return '#4ECDC4'; // Calm teal from theme
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
            style={[styles.infoButton, showInfoBox && styles.infoButtonActive]}
            onPress={handleInfoPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.infoButtonText, showInfoBox && styles.infoButtonTextActive]}>i</Text>
          </TouchableOpacity>
          
          {/* Info Box */}
          {showInfoBox && (
            <Animated.View 
              style={[
                styles.infoBox,
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 0],
                    })
                  }]
                }
              ]}
            >
              <Text style={styles.infoBoxText}>
                Our Today page uses evidence-based approaches to mental wellness. Each session is designed using proven techniques from cognitive behavioral therapy, mindfulness research, and neuroscience.{'\n\n'}
                Personalized recommendations adapt to your progress and preferences, helping you build sustainable mental health habits.
              </Text>
            </Animated.View>
          )}
        </View>
      </View>
      
      {/* Invisible overlay for tap detection when info box is open */}
      {showInfoBox && (
        <TouchableWithoutFeedback onPress={hideInfoBox}>
          <View style={styles.tapOverlay} />
        </TouchableWithoutFeedback>
      )}
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        onScroll={(event) => {
          const currentScrollY = event.nativeEvent.contentOffset.y;
          setScrollY(currentScrollY);
          
          // Calculate if user is at or near the bottom of the content
          const isAtBottom = contentHeight > 0 && scrollViewHeight > 0 && 
            (currentScrollY + scrollViewHeight) >= (contentHeight - 50);
          const isNearBottom = contentHeight > 0 && scrollViewHeight > 0 && 
            (currentScrollY + scrollViewHeight) >= (contentHeight - 150);
          
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

        {/* Today's Focus Card */}
        <View style={styles.card}>
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
                backgroundColor: todayCompleted ? '#e8f5e8' : '#ffffff'
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

              <View style={[styles.sessionPlayButton, { backgroundColor: selectedModule.color }]}>
                <Text style={styles.sessionPlayText}>▶</Text>
              </View>

              {todayCompleted && (
                <View style={styles.sessionCompletedBadge}>
                  <Text style={styles.sessionCompletedText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Alternative Sessions Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>💡 Other Options</Text>
          </View>
          
          <View style={styles.alternativeSessionsList}>
            {todaySessions.filter(s => !s.isRecommended).map((session, index) => (
              <TouchableOpacity
                key={session.id}
                style={styles.alternativeSession}
                onPress={() => handleSessionSelect(session)}
                activeOpacity={0.8}
              >
                <View style={styles.alternativeSessionContent}>
                  <Text style={styles.alternativeSessionTitle}>{session.title}</Text>
                  <Text style={styles.alternativeSessionMeta}>
                    {session.durationMin} min • {session.modality}
                  </Text>
                </View>
                <View style={styles.alternativeSessionPlayButton}>
                  <Text style={styles.alternativeSessionPlayText}>▶</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Progress Path Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🗺️ Progress Path</Text>
          </View>
          
          <Animated.View
            style={[
              styles.progressPathContainer,
              {
                transform: [{ scale: roadmapCardScale }],
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.progressPath}
              onPress={handleRoadmapCardPress}
              onPressIn={handleRoadmapCardPressIn}
              onPressOut={handleRoadmapCardPressOut}
              activeOpacity={1}
            >
              <View style={styles.progressPathHeader}>
                <Text style={styles.progressPathTitle}>{selectedModule.title} Journey</Text>
                <Text style={styles.progressPathSubtitle}>Level 3 of 8</Text>
              </View>

              <View style={styles.progressNodes}>
                <View style={[styles.progressNode, styles.completedNode]}>
                  <Text style={styles.progressNodeText}>1</Text>
                </View>
                <View style={[styles.progressLine, { backgroundColor: selectedModule.color }]} />
                <View style={[styles.progressNode, styles.completedNode]}>
                  <Text style={styles.progressNodeText}>2</Text>
                </View>
                <View style={[styles.progressLine, { backgroundColor: selectedModule.color }]} />
                <View style={[styles.progressNode, styles.currentNode, { borderColor: selectedModule.color }]}>
                  <Text style={styles.progressNodeText}>3</Text>
                </View>
                <View style={[styles.progressLine, { backgroundColor: '#e0e0e0' }]} />
                <View style={[styles.progressNode, styles.lockedNode]}>
                  <Text style={styles.progressNodeText}>4</Text>
                </View>
              </View>

              <Text style={styles.progressPathFooter}>
                Tap to view your full journey
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Motivation Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>✨ Keep Going</Text>
          </View>
          
          <View style={styles.motivationContent}>
            <Text style={styles.motivationText}>{getMotivationalMessage()}</Text>
            <View style={styles.streakInfo}>
              <Text style={styles.streakNumber}>{userProgress.streak}</Text>
              <Text style={styles.streakLabel}>day streak</Text>
            </View>
          </View>
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

      {/* Animated Floating Button - Fixed to Screen */}
      <AnimatedFloatingButton
        backgroundColor={selectedModule.color}
        onPress={() => setShowModuleModal(true)}
        isPillMode={isPillMode}
        onScroll={(scrollY) => setScrollY(scrollY)}
        onDragStart={handleDragStart}
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
  },
  recommendedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
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
    justifyContent: 'space-between',
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
  sessionCompletedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#34c759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionCompletedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  alternativeSessionsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  alternativeSession: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
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
  alternativeSessionMeta: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '400',
  },
  alternativeSessionPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f2f2f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alternativeSessionPlayText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: 'bold',
    marginLeft: 1,
  },
  progressPathContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  progressPath: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  progressPathHeader: {
    marginBottom: 16,
  },
  progressPathTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  progressPathSubtitle: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
  },
  progressNodes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  progressNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  completedNode: {
    backgroundColor: '#34c759',
    borderColor: '#34c759',
  },
  currentNode: {
    backgroundColor: '#ffffff',
    borderWidth: 3,
  },
  lockedNode: {
    backgroundColor: '#f2f2f7',
    borderColor: '#e0e0e0',
  },
  progressNodeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  progressLine: {
    width: 16,
    height: 2,
    marginHorizontal: 4,
  },
  progressPathFooter: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '400',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  motivationContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    alignItems: 'center',
  },
  motivationText: {
    fontSize: 17,
    color: '#000000',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  streakInfo: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
  },
  streakLabel: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
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
  infoBox: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 280,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
  },
  infoBoxText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'left',
  },
  tapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
}); 