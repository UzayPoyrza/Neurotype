import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { ModuleRoadmap } from '../components/ModuleRoadmap';
import { mentalHealthModules } from '../data/modules';
import { useStore } from '../store/useStore';

export const RoadmapScreen: React.FC = () => {
  const navigation = useNavigation();
  const todayModuleId = useStore(state => state.todayModuleId);
  const setActiveSession = useStore(state => state.setActiveSession);
  const selectedModule = mentalHealthModules.find(m => m.id === todayModuleId) || mentalHealthModules[0];
  
  const handleSessionSelect = (session: any) => {
    setActiveSession(session);
  };
  
  return (
    <ModuleRoadmap
      module={selectedModule}
      todayCompleted={false}
      triggerUnlockAnimation={false}
      onUnlockComplete={() => {}}
      onSessionSelect={handleSessionSelect}
      onBackPress={() => navigation.goBack()}
    />
  );
};