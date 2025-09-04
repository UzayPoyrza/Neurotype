import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Session } from '../types';
import { MentalHealthModule } from '../data/modules';
import { mockSessions } from '../data/mockData';
import { theme } from '../styles/theme';

interface RoadmapNode {
  id: string;
  session: Session;
  level: number;
  status: 'locked' | 'available' | 'completed';
  isToday?: boolean;
  isUnlocking?: boolean;
  isRecommended?: boolean;
}

interface TodayNode {
  id: string;
  sessions: Session[];
  level: number;
  status: 'available' | 'completed';
  isToday: true;
  recommendedSessionId: string;
}

interface ModuleRoadmapProps {
  module: MentalHealthModule;
  todayCompleted?: boolean;
  triggerUnlockAnimation?: boolean;
  onUnlockComplete?: () => void;
  onSessionSelect?: (session: Session) => void;
}

export const ModuleRoadmap: React.FC<ModuleRoadmapProps> = ({
  module,
  todayCompleted = false,
  triggerUnlockAnimation = false,
  onUnlockComplete,
  onSessionSelect,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Generate roadmap based on module
  const generateModuleRoadmap = (): (RoadmapNode | TodayNode)[] => {
    const nodes: (RoadmapNode | TodayNode)[] = [];
    
    // Filter sessions relevant to this module
    const getModuleSessions = () => {
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
      
      const goals = relevantGoals[module.id as keyof typeof relevantGoals] || ['focus'];
      return mockSessions.filter(session => goals.includes(session.goal));
    };

    const moduleSessions = getModuleSessions();
    const totalLevels = Math.min(8, module.meditationCount); // Max 8 levels
    
    // Create progression roadmap
    for (let level = 1; level <= totalLevels; level++) {
      const sessionIndex = (level - 1) % moduleSessions.length;
      const session = moduleSessions[sessionIndex];
      
      let status: 'locked' | 'available' | 'completed';
      let isToday = false;
      let isUnlocking = false;
      
      if (level <= 2) {
        status = 'completed'; // First 2 levels completed
      } else if (level === 3) {
        status = todayCompleted ? 'completed' : 'available';
        isToday = !todayCompleted;
      } else if (level === 4 && todayCompleted) {
        status = 'available';
        isToday = true;
        isUnlocking = triggerUnlockAnimation;
      } else {
        status = 'locked';
      }
      
      // Special handling for today's node - show multiple sessions
      if (isToday) {
        const todaySessions = moduleSessions.slice(0, 3); // Get 3 sessions for today
        const recommendedSession = todaySessions[0]; // First one is recommended
        
        nodes.push({
          id: `${module.id}-today-${level}`,
          sessions: todaySessions.map((s, idx) => ({
            ...s,
            id: `${s.id}-today-${idx}`,
            title: idx === 0 ? `${s.title} (Recommended)` : s.title,
          })),
          level,
          status: status as 'available' | 'completed',
          isToday: true,
          recommendedSessionId: recommendedSession.id,
        } as TodayNode);
      } else {
        nodes.push({
          id: `${module.id}-level-${level}`,
          session: {
            ...session,
            id: `${session.id}-${level}`,
            title: `${session.title} - Level ${level}`,
          },
          level,
          status,
          isToday,
          isUnlocking,
        } as RoadmapNode);
      }
    }
    
    return nodes;
  };

  const roadmapNodes = generateModuleRoadmap();
  const todayIndex = roadmapNodes.findIndex(node => node.isToday);

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
    // Auto-scroll to today's level
    const timer = setTimeout(() => {
      if (scrollViewRef.current && todayIndex !== -1) {
        const nodeHeight = 120;
        const screenHeight = Dimensions.get('window').height;
        const scrollToY = Math.max(0, (todayIndex * nodeHeight) - (screenHeight / 2) + 60);
        
        scrollViewRef.current.scrollTo({
          y: scrollToY,
          animated: true,
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [todayIndex]);

  const renderTodaySection = (node: TodayNode, index: number) => {
    const isAvailable = node.status === 'available';
    const isCompleted = node.status === 'completed';

    return (
      <View key={node.id} style={styles.todaySection}>
        {/* Connection Line */}
        {index > 0 && (
          <View style={[styles.connectionLine, { backgroundColor: module.color }]} />
        )}
        
        {/* Today Header */}
        <View style={styles.todayHeaderContainer}>
          <View style={[styles.todayLevelBadge, { backgroundColor: module.color }]}>
            <Text style={styles.todayLevelText}>{node.level}</Text>
          </View>
          <Text style={styles.todayHeaderText}>TODAY'S FOCUS</Text>
        </View>

        {/* Swipable Today Nodes */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.todayNodesScroll}
          contentContainerStyle={styles.todayNodesContainer}
          snapToInterval={176} // 160 + 16 margin
          decelerationRate="fast"
          bounces={false}
        >
          {node.sessions.map((session, idx) => {
            const isRecommended = session.id.includes(node.recommendedSessionId);
            
            return (
              <View key={session.id} style={styles.todayNodeWrapper}>
                <TouchableOpacity
                  onPress={() => onSessionSelect?.(session)}
                  activeOpacity={0.9}
                >
                  <Animated.View style={[
                    styles.todayNode,
                    isCompleted && styles.completedTodayNode,
                    isAvailable && styles.availableTodayNode,
                    isRecommended && styles.recommendedTodayNode,
                    { borderColor: module.color },
                    {
                      shadowColor: module.color,
                      shadowOpacity: isAvailable ? (isRecommended ? 0.4 : 0.2) : 0.1,
                      shadowRadius: isAvailable ? (isRecommended ? 12 : 8) : 4,
                      transform: [{
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: isRecommended ? [1, 1.03] : [1, 1.01],
                        }),
                      }],
                    }
                  ]}>
                    {/* Recommended Badge */}
                    {isRecommended && (
                      <View style={[styles.recommendedBadge, { backgroundColor: module.color }]}>
                        <Text style={styles.recommendedText}>★</Text>
                      </View>
                    )}

                    {/* Session Content */}
                    <View style={styles.todayNodeContent}>
                      <Text style={[
                        styles.todaySessionTitle,
                        isRecommended && { color: module.color },
                      ]} numberOfLines={2}>
                        {session.title.replace(' (Recommended)', '')}
                      </Text>
                      
                      <Text style={styles.todaySessionDuration}>
                        {session.durationMin} min
                      </Text>
                      
                      <Text style={styles.todaySessionModality}>
                        {session.modality}
                      </Text>

                      {isRecommended && (
                        <Text style={[styles.recommendedLabel, { color: module.color }]}>
                          RECOMMENDED
                        </Text>
                      )}
                    </View>

                    {/* Play Icon */}
                    <View style={[styles.todayPlayIcon, { backgroundColor: module.color }]}>
                      <Text style={styles.playIconText}>▶</Text>
                    </View>
                  </Animated.View>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderRegularNode = (node: RoadmapNode, index: number) => {
    const isAvailable = node.status === 'available';
    const isCompleted = node.status === 'completed';
    const isLocked = node.status === 'locked';
    
    const nodeStyle = [
      styles.roadmapNode,
      isCompleted && styles.completedNode,
      isAvailable && styles.availableNode,
      isLocked && styles.lockedNode,
      { borderColor: module.color },
    ];

    const animatedStyle = {
      shadowColor: module.color,
      shadowOpacity: isAvailable ? glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.2, 0.5],
      }) : 0.1,
      shadowRadius: isAvailable ? glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [4, 10],
      }) : 4,
    };

    return (
      <View key={node.id} style={styles.nodeContainer}>
        {/* Connection Line */}
        {index > 0 && (
          <View style={[styles.connectionLine, { backgroundColor: module.color }]} />
        )}
        
        {/* Node */}
        <TouchableOpacity
          onPress={() => onSessionSelect?.(node.session)}
          disabled={isLocked}
          activeOpacity={0.8}
        >
          <Animated.View style={[nodeStyle, animatedStyle]}>
            {/* Level Badge */}
            <View style={[styles.levelBadge, { backgroundColor: module.color }]}>
              <Text style={styles.levelText}>{node.level}</Text>
            </View>

            {/* Status Icon */}
            {isCompleted && (
              <View style={styles.completedIcon}>
                <Text style={styles.completedText}>✓</Text>
              </View>
            )}
            
            {isLocked && (
              <View style={styles.lockedIcon}>
                <Text style={styles.lockText}>🔒</Text>
              </View>
            )}
            
            {isAvailable && (
              <View style={[styles.availableIcon, { backgroundColor: module.color }]}>
                <Text style={styles.availableText}>▶</Text>
              </View>
            )}

            {/* Session Info */}
            <Text style={[
              styles.sessionTitle,
              isLocked && styles.lockedTitle,
            ]} numberOfLines={2}>
              {node.session.title}
            </Text>
            
            <Text style={[
              styles.sessionDuration,
              isLocked && styles.lockedDuration,
            ]}>
              {node.session.durationMin}min
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderNode = (node: RoadmapNode | TodayNode, index: number) => {
    if (node.isToday && 'sessions' in node) {
      return renderTodaySection(node as TodayNode, index);
    }
    return renderRegularNode(node as RoadmapNode, index);
  };

  return (
    <View style={styles.container}>
      {/* Module Header */}
      <View style={[styles.moduleHeader, { backgroundColor: `${module.color}15` }]}>
        <View style={[styles.moduleIndicator, { backgroundColor: module.color }]} />
        <View style={styles.moduleInfo}>
          <Text style={styles.moduleTitle}>{module.title} Roadmap</Text>
          <Text style={styles.moduleDescription}>{module.description}</Text>
        </View>
        <View style={styles.progressIndicator}>
          <Text style={styles.progressText}>
            {roadmapNodes.filter(n => n.status === 'completed').length} / {roadmapNodes.length}
          </Text>
        </View>
      </View>

      {/* Roadmap */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.roadmapScroll}
        contentContainerStyle={styles.roadmapContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {roadmapNodes.map(renderNode)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.border,
  },
  moduleIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
  },
  moduleDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontFamily: theme.typography.fontFamily,
  },
  progressIndicator: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
  },
  roadmapScroll: {
    flex: 1,
  },
  roadmapContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  nodeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  connectionLine: {
    width: 4,
    height: 30,
    borderRadius: 2,
    marginBottom: 8,
    opacity: 0.6,
  },
  roadmapNode: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.surface,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    padding: 12,
    position: 'relative',
  },
  completedNode: {
    backgroundColor: '#e8f5e8',
  },
  availableNode: {
    backgroundColor: theme.colors.surface,
  },
  lockedNode: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  // Today Section Styles
  todaySection: {
    marginVertical: 32,
    width: '100%',
  },
  todayHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  todayLevelBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
    marginRight: 8,
  },
  todayLevelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
  todayHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 0.5,
    fontFamily: theme.typography.fontFamily,
  },
  todayNodesScroll: {
    height: 220,
  },
  todayNodesContainer: {
    paddingHorizontal: 20,
  },
  todayNodeWrapper: {
    marginHorizontal: 8,
  },
  todayNode: {
    width: 160,
    height: 200,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    padding: 16,
    justifyContent: 'space-between',
  },
  completedTodayNode: {
    backgroundColor: '#e8f5e8',
  },
  availableTodayNode: {
    backgroundColor: theme.colors.surface,
  },
  recommendedTodayNode: {
    borderWidth: 3,
    backgroundColor: '#fff8f0',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  recommendedText: {
    fontSize: 10,
    color: theme.colors.surface,
    fontWeight: 'bold',
  },
  todayNodeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todaySessionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 8,
    fontFamily: theme.typography.fontFamily,
  },
  todaySessionDuration: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: theme.typography.fontFamily,
  },
  todaySessionModality: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    textTransform: 'capitalize',
    marginBottom: 8,
    fontFamily: theme.typography.fontFamily,
  },
  recommendedLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: theme.typography.fontFamily,
  },
  todayPlayIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconText: {
    fontSize: 14,
    color: theme.colors.surface,
    fontWeight: 'bold',
    marginLeft: 1,
  },
  levelBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
  completedIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.success,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  completedText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  lockedIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockText: {
    fontSize: 24,
    opacity: 0.5,
  },
  availableIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  availableText: {
    color: theme.colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  sessionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 13,
    marginBottom: 4,
    fontFamily: theme.typography.fontFamily,
  },
  lockedTitle: {
    color: theme.colors.disabledText,
  },
  sessionDuration: {
    fontSize: 9,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    fontFamily: theme.typography.fontFamily,
  },
  lockedDuration: {
    color: theme.colors.disabledText,
  },
});