import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Session } from '../types';
import { useStore } from '../store/useStore';
import { mockSessions } from '../data/mockData';
import { mentalHealthModules } from '../data/modules';
import { theme } from '../styles/theme';
import { InstagramStyleScreen } from '../components/InstagramStyleScreen';
import { ModuleRoadmap } from '../components/ModuleRoadmap';
import { ModuleGridModal } from '../components/ModuleGridModal';
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
  
  const selectedModule = mentalHealthModules.find(m => m.id === selectedModuleId) || mentalHealthModules[0];
  const todaySessions = [mockSessions[0], mockSessions[1]]; // Fallback

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

  return (
    <InstagramStyleScreen title={`${selectedModule.title} Journey`}>
      <View style={styles.container}>
        {/* Module Roadmap */}
        <ModuleRoadmap
          module={selectedModule}
          todayCompleted={todayCompleted}
          triggerUnlockAnimation={triggerUnlock}
          onUnlockComplete={handleUnlockComplete}
          onSessionSelect={handleSessionSelect}
        />

        {/* Floating Module Selector Button */}
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: selectedModule.color }]}
          onPress={() => setShowModuleModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.floatingButtonIcon}>🔄</Text>
        </TouchableOpacity>

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  floatingButtonIcon: {
    fontSize: 20,
    color: theme.colors.surface,
  },
}); 