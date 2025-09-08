import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, TouchableOpacity, FlatList } from 'react-native';
import { Session } from '../types';
import { useStore } from '../store/useStore';
import { mockSessions } from '../data/mockData';
import { mentalHealthModules } from '../data/modules';
import { theme } from '../styles/theme';
import { InstagramStyleScreen } from '../components/InstagramStyleScreen';
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
    
    // Here you would typically save the rating to your store/backend
    console.log('Session rated:', rating);
  };

  const handleUnlockComplete = () => {
    setTriggerUnlock(false);
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

  // Motivational messages based on progress
  const getMotivationalMessage = () => {
    const streak = userProgress?.streak || 0;
    if (streak === 0) return "Ready to start your journey?";
    if (streak === 1) return "Great start! Let's build momentum.";
    if (streak < 7) return `${streak} days strong! Keep going.`;
    if (streak < 30) return `Amazing ${streak}-day streak! You're building a habit.`;
    return `Incredible ${streak}-day journey! You're a meditation master.`;
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
    <ScrollView style={styles.todayContainer} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={[styles.heroSection, { backgroundColor: `${selectedModule.color}10` }]}>
        <View style={styles.dateContainer}>
          <Text style={styles.dayName}>{dateInfo.dayName}</Text>
          <View style={styles.dateRow}>
            <Text style={styles.dayNumber}>{dateInfo.dayNumber}</Text>
            <Text style={styles.monthName}>{dateInfo.monthName}</Text>
          </View>
        </View>
        
        <View style={styles.motivationContainer}>
          <Text style={styles.motivationalText}>{getMotivationalMessage()}</Text>
          <View style={[styles.moduleIndicator, { backgroundColor: selectedModule.color }]}>
            <Text style={styles.moduleIndicatorText}>{selectedModule.title}</Text>
          </View>
        </View>
      </View>

      {/* Progress Summary */}
      <View style={styles.progressSummary}>
        <View style={styles.progressItem}>
          <Text style={styles.progressNumber}>{userProgress?.streak || 0}</Text>
          <Text style={styles.progressLabel}>Day Streak</Text>
        </View>
        <View style={styles.progressDivider} />
        <View style={styles.progressItem}>
          <Text style={styles.progressNumber}>{todayCompleted ? '1' : '0'}</Text>
          <Text style={styles.progressLabel}>Today's Sessions</Text>
        </View>
        <View style={styles.progressDivider} />
        <View style={styles.progressItem}>
          <Text style={styles.progressNumber}>
            {userProgress?.sessionDeltas?.length || 0}
          </Text>
          <Text style={styles.progressLabel}>Total Sessions</Text>
        </View>
      </View>

      {/* Today's Focus Section */}
      <View style={styles.focusSection}>
        <Text style={styles.sectionTitle}>Today's Focus</Text>
        <Text style={styles.sectionSubtitle}>
          Personalized for your {selectedModule.title.toLowerCase()} journey
        </Text>

        {/* Recommended Session Card */}
        <TouchableOpacity
          style={[styles.recommendedCard, { borderColor: selectedModule.color }]}
          onPress={() => handleSessionSelect(recommendedSession)}
          activeOpacity={0.9}
        >
          <View style={[styles.recommendedBadge, { backgroundColor: selectedModule.color }]}>
            <Text style={styles.recommendedBadgeText}>★ RECOMMENDED</Text>
          </View>
          
          <View style={styles.recommendedContent}>
            <Text style={styles.recommendedTitle}>{recommendedSession.title}</Text>
            <Text style={styles.recommendedReason}>
              {recommendedSession.adaptiveReason || 'Based on your recent progress'}
            </Text>
            
            <View style={styles.recommendedDetails}>
              <View style={styles.detailChip}>
                <Text style={styles.detailChipText}>{recommendedSession.durationMin} min</Text>
              </View>
              <View style={styles.detailChip}>
                <Text style={styles.detailChipText}>{recommendedSession.modality}</Text>
              </View>
              <View style={styles.detailChip}>
                <Text style={styles.detailChipText}>{recommendedSession.goal}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.playButton, { backgroundColor: selectedModule.color }]}>
            <Text style={styles.playButtonText}>▶</Text>
          </View>
        </TouchableOpacity>

        {/* Alternative Sessions */}
        <Text style={styles.alternativesTitle}>Other Options</Text>
        <View style={styles.alternativesList}>
          {todaySessions.filter(s => !s.isRecommended).map((session, index) => (
            <TouchableOpacity
              key={session.id}
              style={styles.alternativeCard}
              onPress={() => handleSessionSelect(session)}
              activeOpacity={0.8}
            >
              <View style={styles.alternativeContent}>
                <Text style={styles.alternativeTitle}>{session.title}</Text>
                <View style={styles.alternativeDetails}>
                  <Text style={styles.alternativeDetail}>{session.durationMin}m</Text>
                  <Text style={styles.alternativeDetail}>•</Text>
                  <Text style={styles.alternativeDetail}>{session.modality}</Text>
                </View>
              </View>
              <View style={styles.alternativePlayButton}>
                <Text style={styles.alternativePlayText}>▶</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick Access to Roadmap */}
      <TouchableOpacity 
        style={styles.roadmapPreview}
        onPress={() => setViewMode('roadmap')}
        activeOpacity={0.8}
      >
        <Text style={styles.roadmapPreviewTitle}>View Your Progress Path</Text>
        <Text style={styles.roadmapPreviewSubtitle}>
          See your journey and unlock tomorrow's sessions
        </Text>
        <View style={styles.roadmapPreviewArrow}>
          <Text style={styles.arrowText}>→</Text>
        </View>
      </TouchableOpacity>
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
      <InstagramStyleScreen title={viewMode === 'today' ? 'Today' : `${selectedModule.title} Journey`}>
        <View style={styles.container}>
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
      </InstagramStyleScreen>

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
    backgroundColor: 'transparent',
  },
  
  // Today View Styles
  todayContainer: {
    flex: 1,
  },
  
  // Hero Section
  heroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
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
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'right',
    marginBottom: theme.spacing.sm,
  },
  
  moduleIndicator: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.surface,
  },
  
  moduleIndicatorText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
    fontFamily: theme.typography.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Progress Summary
  progressSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  },
  
  progressItem: {
    alignItems: 'center',
  },
  
  progressNumber: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
  },
  
  progressLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily,
    marginTop: theme.spacing.xs,
  },
  
  progressDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
  },
  
  // Focus Section
  focusSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  
  sectionTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.xs,
  },
  
  sectionSubtitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.xl,
  },
  
  // Recommended Session Card
  recommendedCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borders.width.thick,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    position: 'relative',
    ...theme.shadows.medium,
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
  
  recommendedContent: {
    marginBottom: theme.spacing.lg,
  },
  
  recommendedTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.sm,
  },
  
  recommendedReason: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
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
  },
  
  detailChipText: {
    fontSize: theme.typography.sizes.sm,
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
  
  // Alternative Sessions
  alternativesTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.md,
  },
  
  alternativesList: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  
  alternativeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.small,
  },
  
  alternativeContent: {
    flex: 1,
  },
  
  alternativeTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.xs,
  },
  
  alternativeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  
  alternativeDetail: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily,
  },
  
  alternativePlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  alternativePlayText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.bold,
    marginLeft: 1,
  },
  
  // Roadmap Preview
  roadmapPreview: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.small,
  },
  
  roadmapPreviewTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.xs,
  },
  
  roadmapPreviewSubtitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily,
    flex: 1,
  },
  
  roadmapPreviewArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.lg,
  },
  
  arrowText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  
  // Roadmap View
  roadmapContainer: {
    flex: 1,
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