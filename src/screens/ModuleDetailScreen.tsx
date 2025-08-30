import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { SessionCard } from '../components/SessionCard';
import { mockSessions } from '../data/mockData';
import { mentalHealthModules } from '../data/modules';
import { useStore } from '../store/useStore';
import { theme } from '../styles/theme';
import { Session } from '../types';

type ExploreStackParamList = {
  ExploreMain: undefined;
  ModuleDetail: { moduleId: string };
};

type ModuleDetailRouteProp = RouteProp<ExploreStackParamList, 'ModuleDetail'>;
type ModuleDetailNavigationProp = StackNavigationProp<ExploreStackParamList, 'ModuleDetail'>;

interface ModuleDetailScreenProps {}

export const ModuleDetailScreen: React.FC<ModuleDetailScreenProps> = () => {
  const route = useRoute<ModuleDetailRouteProp>();
  const navigation = useNavigation<ModuleDetailNavigationProp>();
  const setActiveSession = useStore(state => state.setActiveSession);
  
  const { moduleId } = route.params;
  const module = mentalHealthModules.find(m => m.id === moduleId);
  
  // Filter sessions based on module type
  const moduleSessions = useMemo(() => {
    if (!module) return [];
    
    // Map module IDs to session goals/types
    const moduleToGoalMap: Record<string, string[]> = {
      'anxiety': ['anxiety'],
      'adhd': ['focus'],
      'depression': ['stress', 'sleep'],
      'bipolar': ['stress'],
      'panic': ['anxiety'],
      'ptsd': ['stress'],
      'stress': ['stress'],
      'sleep': ['sleep'],
      'focus': ['focus'],
      'emotional-regulation': ['anxiety', 'stress'],
      'mindfulness': ['anxiety', 'focus', 'stress'],
      'self-compassion': ['stress'],
    };
    
    const relevantGoals = moduleToGoalMap[moduleId] || ['anxiety'];
    
    return mockSessions.filter(session => 
      relevantGoals.includes(session.goal)
    );
  }, [moduleId, module]);

  const handleSessionStart = (session: Session) => {
    setActiveSession(session);
  };

  if (!module) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Module not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={[styles.moduleIcon, { backgroundColor: module.color }]}>
            <Text style={styles.moduleIconText}>{module.title.charAt(0)}</Text>
          </View>
          <Text style={styles.moduleTitle}>{module.title}</Text>
          <Text style={styles.moduleDescription}>{module.description}</Text>
        </View>
      </View>

      {/* Sessions List */}
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Guided Meditations
          </Text>
          <Text style={styles.sectionSubtitle}>
            {moduleSessions.length} sessions available
          </Text>
        </View>

        <FlatList
          data={moduleSessions}
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              onStart={() => handleSessionStart(item)}
              variant="list"
            />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
        />

        {moduleSessions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Coming Soon
            </Text>
            <Text style={styles.emptySubtext}>
              Meditations for {module.title} are being prepared
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    paddingTop: 60, // Account for status bar
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: theme.borders.width.thick,
    borderBottomColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.background,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
    borderRadius: theme.borders.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  backButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  headerContent: {
    alignItems: 'center',
  },
  moduleIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  moduleIconText: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  moduleTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  moduleDescription: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.secondary,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  sectionHeader: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.secondary,
    fontFamily: theme.typography.fontFamily,
  },
  listContainer: {
    paddingBottom: theme.spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.lg,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  emptyText: {
    color: theme.colors.primary,
    textAlign: 'center',
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.fontFamily,
  },
  emptySubtext: {
    color: theme.colors.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.weights.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
});