import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, TouchableOpacity, FlatList, AccessibilityInfo } from 'react-native';
import { Session } from '../types';
import { useStore } from '../store/useStore';
import { mockSessions } from '../data/mockData';
import { mentalHealthModules } from '../data/modules';
import { theme } from '../styles/theme';
import { ModuleRoadmap } from '../components/ModuleRoadmap';
import { ModuleGridModal } from '../components/ModuleGridModal';
import { DraggableFloatingButton } from '../components/DraggableFloatingButton';
import { SessionBottomSheet } from '../components/SessionBottomSheet';
import { SessionProgressView } from '../components/SessionProgressView';
import { SessionRating } from '../components/SessionRating';

type SessionState = 'not_started' | 'in_progress' | 'completed' | 'rating';

export const TodayScreen: React.FC = () => {
  const { setActiveSession } = useStore();
  const userProgress = useStore(state => state.userProgress);
  
  // Module and session state management
  const [selectedModuleId, setSelectedModuleId] = useState('anxiety'); // Default to anxiety
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>('not_started');
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [todayCompleted, setTodayCompleted] = useState(false);
  const [triggerUnlock, setTriggerUnlock] = useState(false);
  const [viewMode, setViewMode] = useState<'today' | 'roadmap'>('today');
  const [showRecommendationInfo, setShowRecommendationInfo] = useState(false);
  
  // Animation refs - simplified to avoid native driver conflicts
  const heroCardScale = useRef(new Animated.Value(1)).current;
  const completionAnimation = useRef(new Animated.Value(0)).current;
  const unlockAnimation = useRef(new Animated.Value(0)).current;
  const roadmapCardScale = useRef(new Animated.Value(1)).current;
  
  const selectedModule = mentalHealthModules.find(m => m.id === selectedModuleId) || mentalHealthModules[0];
  
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
    // First scale down, then expand animation
    Animated.sequence([
      Animated.timing(roadmapCardScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(roadmapCardScale, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setViewMode('roadmap');
      // Reset scale after navigation
      roadmapCardScale.setValue(1);
    });
  };

  const handleCancel = () => {
    setSelectedSession(null);
    setShowBottomSheet(false);
    setSessionState('not_started');
  };

  // Get current date info
  const getCurrentDateInfo = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return {
      fullDate: today.toLocaleDateString('en-US', options),
      dayName: today.toLocaleDateString('en-US', { weekday: 'long' }),
      dayNumber: today.getDate(),
      monthName: today.toLocaleDateString('en-US', { month: 'long' })
    };
  };

  const dateInfo = getCurrentDateInfo();

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

  const renderTodayView = () => (
    <ScrollView 
      style={styles.todayContainer} 
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
    >
      {/* Today's Focus Section */}
      <View style={styles.focusSection}>
        <View style={styles.focusHeader}>
          <Text style={styles.sectionTitle}>Today's Focus</Text>
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => setShowRecommendationInfo(!showRecommendationInfo)}
            accessibilityLabel="Why this is recommended"
            accessibilityRole="button"
          >
            <Text style={styles.infoIcon}>i</Text>
          </TouchableOpacity>
        </View>

        {showRecommendationInfo && (
          <View style={styles.infoPanel}>
            <Text style={styles.infoPanelText}>
              This session is recommended based on your progress in the {selectedModule.title.toLowerCase()} roadmap, 
              your recent feedback, and evidence-based sequencing for optimal mental health outcomes.
            </Text>
          </View>
        )}

        <Text style={styles.sectionSubtitle}>
          Personalized for your {selectedModule.title.toLowerCase()} journey
        </Text>


        {/* Enhanced Recommended Session Card */}
        <Animated.View
          style={[
            styles.recommendedCardContainer,
            {
              transform: [{ scale: heroCardScale }],
            }
          ]}
        >
          <TouchableOpacity
            style={[styles.recommendedCard, { 
              borderColor: getAccentColor(),
              backgroundColor: todayCompleted ? '#e8f5e8' : 'rgba(78, 205, 196, 0.05)'
            }]}
            onPress={() => handleSessionSelect(recommendedSession)}
            onPressIn={handleHeroCardPressIn}
            onPressOut={handleHeroCardPressOut}
            activeOpacity={1}
            accessibilityLabel={`Play ${recommendedSession.title}, ${recommendedSession.durationMin} minutes, recommended`}
            accessibilityRole="button"
            accessible={true}
          >
            <View style={[styles.recommendedBadge, { backgroundColor: getAccentColor() }]}>
              <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
            </View>
            
            {todayCompleted && (
              <Animated.View 
                style={[
                  styles.completionCheck,
                  {
                    opacity: completionAnimation,
                    transform: [{
                      scale: completionAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.2],
                      })
                    }]
                  }
                ]}
              >
                <Text style={styles.checkMark}>✓</Text>
              </Animated.View>
            )}
            
            <View style={styles.recommendedContent}>
              <Text style={styles.recommendedTitle}>{recommendedSession.title}</Text>
              <Text style={styles.recommendedReason}>
                {recommendedSession.adaptiveReason || 'Based on your recent progress'}
              </Text>
              
              <View style={styles.recommendedDetails}>
                <View style={styles.detailChip}>
                  <Text style={styles.detailChipIcon}>⏱</Text>
                  <Text style={styles.detailChipText}>{recommendedSession.durationMin} min</Text>
                </View>
                <View style={styles.detailChip}>
                  <Text style={styles.detailChipIcon}>🎧</Text>
                  <Text style={styles.detailChipText}>{recommendedSession.modality}</Text>
                </View>
                <View style={styles.detailChip}>
                  <Text style={styles.detailChipIcon}>🎯</Text>
                  <Text style={styles.detailChipText}>{recommendedSession.goal}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.playButton, { backgroundColor: getAccentColor() }]}>
              <Text style={styles.playButtonText}>▶</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>


        {/* Alternative Sessions with increased spacing */}
        <View style={styles.alternativesSection}>
          <Text style={styles.alternativesTitle}>Other Options</Text>
          <View style={styles.alternativesList}>
            {todaySessions.filter(s => !s.isRecommended).map((session, index) => (
              <TouchableOpacity
                key={session.id}
                style={styles.alternativeCard}
                onPress={() => handleSessionSelect(session)}
                activeOpacity={0.8}
                accessibilityLabel={`Play ${session.title}, ${session.durationMin} minutes`}
                accessibilityRole="button"
              >
                <View style={styles.alternativeContent}>
                  <Text style={styles.alternativeTitle}>{session.title}</Text>
                  <View style={styles.alternativeDetails}>
                    <Text style={styles.alternativeDetailIcon}>⏱</Text>
                    <Text style={styles.alternativeDetail}>{session.durationMin}m</Text>
                    <Text style={styles.alternativeDetailIcon}>🎧</Text>
                    <Text style={styles.alternativeDetail}>{session.modality}</Text>
                    <Text style={styles.alternativeDetailIcon}>🎯</Text>
                    <Text style={styles.alternativeDetail}>{session.goal}</Text>
                  </View>
                </View>
                <View style={styles.alternativePlayButton}>
                  <Text style={styles.alternativePlayText}>▶</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Progress Path Section */}
      <View style={styles.progressPathSection}>
        <Text style={styles.progressPathTitle}>View Your Progress Path</Text>
        
        {/* Mini Roadmap Preview Card */}
        <Animated.View
          style={[
            styles.miniRoadmapCard,
            {
              transform: [{ scale: roadmapCardScale }],
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.miniRoadmapCardTouchable}
            onPress={handleRoadmapCardPress}
            onPressIn={handleRoadmapCardPressIn}
            onPressOut={handleRoadmapCardPressOut}
            activeOpacity={1}
          >
          <View style={styles.miniRoadmapHeader}>
            <Text style={styles.miniRoadmapTitle}>{selectedModule.title} Journey</Text>
            <View style={styles.miniRoadmapArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </View>
          
          {/* Mini Roadmap Visual */}
          <View style={styles.miniRoadmapVisual}>
            <View style={styles.miniRoadmapTrack}>
              <View style={[styles.miniRoadmapSegment, { backgroundColor: theme.colors.success }]}>
                <View style={styles.miniRoadmapDot} />
              </View>
              <View style={[styles.miniRoadmapSegment, { backgroundColor: theme.colors.success }]}>
                <View style={styles.miniRoadmapDot} />
              </View>
              <View style={[styles.miniRoadmapSegment, { backgroundColor: getAccentColor() }]}>
                <View style={[styles.miniRoadmapDot, { backgroundColor: theme.colors.surface }]} />
              </View>
              <View style={[styles.miniRoadmapSegment, { backgroundColor: theme.colors.disabled }]}>
                <View style={styles.miniRoadmapDot} />
              </View>
              <View style={[styles.miniRoadmapSegment, { backgroundColor: theme.colors.disabled }]}>
                <View style={styles.miniRoadmapDot} />
              </View>
            </View>
            <Text style={styles.miniRoadmapLabel}>Tap to expand and explore your full journey</Text>
          </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScrollView>
  );

  const renderRoadmapView = () => (
    <View style={styles.roadmapContainer}>
      <TouchableOpacity 
        style={styles.backToToday}
        onPress={() => setViewMode('today')}
        activeOpacity={0.8}
      >
        <Text style={styles.backToTodayText}>← Back to Today</Text>
      </TouchableOpacity>
      
      <ModuleRoadmap
        module={selectedModule}
        todayCompleted={todayCompleted}
        triggerUnlockAnimation={triggerUnlock}
        onUnlockComplete={handleUnlockComplete}
        onSessionSelect={handleSessionSelect}
      />
    </View>
  );

  return (
    <>
      <View style={styles.container}>
        {/* Simple top line under dynamic island */}
        <View style={styles.topLine} />
        
        {viewMode === 'today' ? renderTodayView() : renderRoadmapView()}

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
      </View>

      {/* Draggable Floating Button - Fixed to Screen */}
      <DraggableFloatingButton
        backgroundColor={selectedModule.color}
        onPress={() => setShowModuleModal(true)}
        icon="🔄"
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  
  topLine: {
    width: '100%',
    height: theme.borders.width.thick,
    backgroundColor: theme.colors.primary,
    marginTop: 50, // Under dynamic island - moved up
  },
  
  // Today View Styles
  todayContainer: {
    flex: 1,
    paddingTop: 10, // Space for top line - reduced
  },
  
  // Hero Section - Refined
  heroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
  },
  
  dateContainer: {
    flex: 1,
  },
  
  dayName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.xs,
  },
  
  dateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  
  dayNumber: {
    fontSize: 36,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
    marginRight: theme.spacing.sm,
  },
  
  monthName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
  },
  
  motivationContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  
  motivationalText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.normal, // Lighter weight
    color: theme.colors.text.secondary, // More subtle
    fontFamily: theme.typography.fontFamily,
    textAlign: 'right',
    marginBottom: theme.spacing.sm,
  },

  // Subtle streak indicator
  streakIndicator: {
    alignItems: 'flex-end',
  },

  streakDots: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
    gap: 3,
  },

  streakDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  streakText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.normal,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily,
  },
  
  // Compact Progress Summary
  compactProgressSummary: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borders.width.thin,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  },
  
  compactProgressItem: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.lg,
  },
  
  compactProgressNumber: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
  },
  
  compactProgressLabel: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.normal, // Lighter weight
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily,
    marginTop: 2,
  },
  
  compactProgressDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
  },
  
  // Focus Section
  focusSection: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm, // Reduced from lg
    marginBottom: theme.spacing.xl,
  },

  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  
  sectionTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold, // Stronger hierarchy
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
  },

  infoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    borderWidth: theme.borders.width.thin,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44, // Accessibility
    minWidth: 44,
  },

  infoIcon: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily,
  },

  infoPanel: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borders.width.thin,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },

  infoPanelText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.normal,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily,
    lineHeight: 20,
  },
  
  sectionSubtitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.normal, // Lighter weight
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.lg, // Reduced from xl
  },
  
  // Enhanced Recommended Session Card
  recommendedCardContainer: {
    marginBottom: theme.spacing.xl, // Reduced spacing
  },

  recommendedCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl, // Larger radius
    borderWidth: theme.borders.width.normal,
    padding: theme.spacing.xl,
    position: 'relative',
    minHeight: 180, // Larger card
    shadowColor: '#4ECDC4', // Teal shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    left: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.surface,
  },
  
  recommendedBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
    fontFamily: theme.typography.fontFamily,
    letterSpacing: 0.5,
  },

  completionCheck: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkMark: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
  },
  
  recommendedContent: {
    marginBottom: theme.spacing.lg,
  },
  
  recommendedTitle: {
    fontSize: theme.typography.sizes.xxl, // Larger title
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.sm,
  },
  
  recommendedReason: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.normal, // Lighter weight
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily,
    fontStyle: 'italic',
    marginBottom: theme.spacing.lg,
  },
  
  recommendedDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  
  detailChip: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: theme.borders.width.thin,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },

  detailChipIcon: {
    fontSize: theme.typography.sizes.xs,
  },
  
  detailChipText: {
    fontSize: theme.typography.sizes.xs, // Smaller metadata
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
    textTransform: 'capitalize',
  },
  
  playButton: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  
  playButtonText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.surface,
    fontWeight: theme.typography.weights.bold,
    marginLeft: 2,
  },

  
  // Alternative Sessions - Refined
  alternativesSection: {
    marginTop: theme.spacing.lg, // Reduced spacing
  },

  alternativesTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.md,
  },
  
  alternativesList: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg, // Reduced spacing
  },
  
  alternativeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borders.width.thin, // Reduced elevation
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, // Lighter shadow
    shadowRadius: 2,
    elevation: 1,
    minHeight: 44, // Accessibility
  },
  
  alternativeContent: {
    flex: 1,
  },
  
  alternativeTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium, // Lighter weight
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.xs,
  },
  
  alternativeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },

  alternativeDetailIcon: {
    fontSize: theme.typography.sizes.xs,
  },
  
  alternativeDetail: {
    fontSize: theme.typography.sizes.xs, // Smaller typography
    fontWeight: theme.typography.weights.normal,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily,
    marginRight: theme.spacing.xs,
  },
  
  alternativePlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    borderWidth: theme.borders.width.thin,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  alternativePlayText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.bold,
    marginLeft: 1,
  },
  
  // Progress Path Section
  progressPathSection: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },

  progressPathTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.md,
  },

  // Mini Roadmap Card
  miniRoadmapCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  },

  miniRoadmapCardTouchable: {
    padding: theme.spacing.lg,
  },

  miniRoadmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },

  miniRoadmapTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
  },

  miniRoadmapArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.background,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  arrowText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },

  // Mini Roadmap Visual
  miniRoadmapVisual: {
    alignItems: 'center',
  },

  miniRoadmapTrack: {
    flexDirection: 'row',
    height: 24,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: theme.borders.width.thin,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },

  miniRoadmapSegment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  miniRoadmapDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.text.secondary,
  },

  miniRoadmapLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.normal,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Roadmap View
  roadmapContainer: {
    flex: 1,
    paddingTop: 20, // Space for top line
  },
  
  backToToday: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  
  backToTodayText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
  },
}); 