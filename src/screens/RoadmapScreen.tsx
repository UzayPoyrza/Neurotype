import React from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ModuleRoadmap } from '../components/ModuleRoadmap';
import { mentalHealthModules } from '../data/modules';
import { useStore } from '../store/useStore';
import { Session } from '../types';

type TodayStackParamList = {
  TodayMain: undefined;
  Roadmap: { recommendedSession?: Session };
  MeditationDetail: { sessionId: string };
  Player: undefined;
};

type RoadmapScreenRouteProp = RouteProp<TodayStackParamList, 'Roadmap'>;
type RoadmapScreenNavigationProp = StackNavigationProp<TodayStackParamList, 'Roadmap'>;

export const RoadmapScreen: React.FC = () => {
  const navigation = useNavigation<RoadmapScreenNavigationProp>();
  const route = useRoute<RoadmapScreenRouteProp>();
  const todayModuleId = useStore(state => state.todayModuleId);
  const setActiveSession = useStore(state => state.setActiveSession);
  const selectedModule = mentalHealthModules.find(m => m.id === todayModuleId) || mentalHealthModules[0];
  
  const handleSessionSelect = (session: any) => {
    setActiveSession(session);
  };
  
  // Set todayCompleted to true for anxiety and ptsd modules to show preview
  const isTodayCompleted = selectedModule.id === 'anxiety' || selectedModule.id === 'ptsd';
  
  const recommendedSession = route.params?.recommendedSession;
  
  return (
    <ModuleRoadmap
      module={selectedModule}
      recommendedSession={recommendedSession}
      todayCompleted={isTodayCompleted}
      triggerUnlockAnimation={false}
      onUnlockComplete={() => {}}
      onSessionSelect={handleSessionSelect}
      onBackPress={() => navigation.goBack()}
    />
  );
};