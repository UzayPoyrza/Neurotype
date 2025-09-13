import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Session } from '../types';
import { MentalHealthModule } from '../data/modules';
import { mockSessions } from '../data/mockData';
import { theme } from '../styles/theme';
import { useStore } from '../store/useStore';

interface MeditationHistoryItem {
  id: string;
  session: Session;
  completedDate: Date;
  status: 'completed' | 'available' | 'suggested';
  isToday?: boolean;
  isRecommended?: boolean;
}

interface TodaySection {
  id: string;
  sessions: Session[];
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
  onBackPress?: () => void;
}

export const ModuleRoadmap: React.FC<ModuleRoadmapProps> = ({
  module,
  todayCompleted = false,
  triggerUnlockAnimation = false,
  onUnlockComplete,
  onSessionSelect,
  onBackPress,
}) => {
  const navigation = useNavigation();
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Generate meditation history based on module
  const generateMeditationHistory = (): (MeditationHistoryItem | TodaySection)[] => {
    const items: (MeditationHistoryItem | TodaySection)[] = [];
    
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
    const completedCount = 3; // Simulate 3 completed meditations
    
    // Add completed meditations
    for (let i = 0; i < completedCount; i++) {
      const session = moduleSessions[i % moduleSessions.length];
      const completedDate = new Date();
      completedDate.setDate(completedDate.getDate() - (completedCount - i));
      
      items.push({
        id: `${module.id}-completed-${i}`,
        session: {
          ...session,
          id: `${session.id}-completed-${i}`,
        },
        completedDate,
        status: 'completed',
      } as MeditationHistoryItem);
    }
    
    // Add Today's section
    const todaySessions = moduleSessions.slice(0, 3);
    const recommendedSession = todaySessions[0];
    
    items.push({
      id: `${module.id}-today`,
      sessions: todaySessions.map((s, idx) => ({
        ...s,
        id: `${s.id}-today-${idx}`,
        title: idx === 0 ? `${s.title} (Recommended)` : s.title,
      })),
      status: todayCompleted ? 'completed' : 'available',
      isToday: true,
      recommendedSessionId: recommendedSession.id,
    } as TodaySection);
    
    // Add suggested meditations for exploration
    for (let i = completedCount + 3; i < Math.min(completedCount + 6, moduleSessions.length); i++) {
      const session = moduleSessions[i % moduleSessions.length];
      
      items.push({
        id: `${module.id}-suggested-${i}`,
        session: {
          ...session,
          id: `${session.id}-suggested-${i}`,
        },
        completedDate: new Date(),
        status: 'suggested',
      } as MeditationHistoryItem);
    }
    
    return items;
  };

  const meditationHistory = generateMeditationHistory();
  const todayIndex = meditationHistory.findIndex(item => item.isToday);

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


  const renderMeditationItem = (item: MeditationHistoryItem | TodaySection, index: number) => {
    if (item.isToday && 'sessions' in item) {
      return renderTodaySection(item as TodaySection, index);
    }
    return renderHistoryItem(item as MeditationHistoryItem, index);
  };

  const renderHistoryItem = (item: MeditationHistoryItem, index: number) => {
    const isCompleted = item.status === 'completed';
    const isSuggested = item.status === 'suggested';
    const isAvailable = item.status === 'available';
    
    const formatDate = (date: Date) => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    };
    
    return (
      <TouchableOpacity
        onPress={() => onSessionSelect?.(item.session)}
        disabled={isSuggested}
        activeOpacity={0.7}
        style={[
          styles.meditationHistoryCard,
          isCompleted && styles.meditationHistoryCardCompleted,
          isSuggested && styles.meditationHistoryCardSuggested,
          isAvailable && styles.meditationHistoryCardAvailable,
        ]}
      >
        {/* Status Indicator */}
        <View style={[
          styles.meditationStatusIndicator,
          { backgroundColor: isCompleted ? '#34C759' : isAvailable ? module.color : '#8E8E93' }
        ]}>
          <Text style={styles.meditationStatusIcon}>
            {isCompleted ? '✓' : isAvailable ? '▶' : '✨'}
          </Text>
        </View>

        {/* Meditation Content */}
        <View style={styles.meditationContent}>
          <Text style={[
            styles.meditationTitle,
            isSuggested && styles.meditationTitleSuggested,
          ]} numberOfLines={2}>
            {item.session.title}
          </Text>
          
          <View style={styles.meditationMeta}>
            <Text style={[
              styles.meditationDuration,
              isSuggested && styles.meditationMetaSuggested,
            ]}>
              {item.session.durationMin} min • {item.session.modality}
            </Text>
            
            {isCompleted && (
              <Text style={styles.meditationDate}>
                {formatDate(item.completedDate)}
              </Text>
            )}
            
            {isSuggested && (
              <Text style={styles.meditationSuggestedLabel}>
                Explore
              </Text>
            )}
          </View>
        </View>

        {/* Action Icon */}
        <View style={styles.meditationAction}>
          {isCompleted && (
            <Text style={styles.meditationCompletedIcon}>🎉</Text>
          )}
          
          {isAvailable && (
            <View style={[styles.meditationPlayButton, { backgroundColor: module.color }]}>
              <Text style={styles.meditationPlayIcon}>▶</Text>
            </View>
          )}
          
          {isSuggested && (
            <Text style={styles.meditationExploreIcon}>🔍</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTodaySection = (section: TodaySection, index: number) => {
    const isCompleted = section.status === 'completed';

    return (
      <View style={styles.todaySection}>
        {/* Today Header */}
        <View style={styles.todaySectionHeader}>
          <View style={[styles.todaySectionIcon, { backgroundColor: module.color }]}>
            <Text style={styles.todaySectionIconText}>🌟</Text>
          </View>
          <View style={styles.todaySectionHeaderText}>
            <Text style={styles.todaySectionTitle}>Today's Focus</Text>
            <Text style={styles.todaySectionSubtitle}>Choose your next meditation</Text>
          </View>
        </View>

        {/* Today Sessions */}
        <View style={styles.todaySessions}>
          {section.sessions.map((session, idx) => {
            const isRecommended = session.id.includes(section.recommendedSessionId);
            
            return (
              <TouchableOpacity
                key={session.id}
                onPress={() => onSessionSelect?.(session)}
                activeOpacity={0.7}
                style={[
                  styles.todaySessionCard,
                  isRecommended && styles.todaySessionCardRecommended,
                ]}
              >
                {/* Recommended Badge */}
                {isRecommended && (
                  <View style={[styles.recommendedBadge, { backgroundColor: module.color }]}>
                    <Text style={styles.recommendedBadgeText}>★</Text>
                  </View>
                )}

                {/* Session Content */}
                <View style={styles.todaySessionContent}>
                  <Text style={[
                    styles.todaySessionTitle,
                    isRecommended && { color: module.color }
                  ]} numberOfLines={2}>
                    {session.title.replace(' (Recommended)', '')}
                  </Text>
                  
                  <Text style={styles.todaySessionMeta}>
                    {session.durationMin} min • {session.modality}
                  </Text>
                  
                  {isRecommended && (
                    <Text style={[styles.recommendedLabel, { color: module.color }]}>
                      Recommended for you
                    </Text>
                  )}
                </View>

                {/* Play Button */}
                <View style={[styles.todayPlayButton, { backgroundColor: module.color }]}>
                  <Text style={styles.todayPlayIcon}>▶</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackPress || (() => navigation.goBack())} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{module.title} Journey</Text>
      </View>

      {/* Meditation History */}
      <ScrollView
        ref={scrollViewRef}
        style={[styles.meditationHistoryScroll, { backgroundColor: globalBackgroundColor }]}
        contentContainerStyle={styles.meditationHistoryContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.meditationHistoryList}>
          {meditationHistory.map((item, index) => (
            <View key={item.id} style={styles.meditationHistoryItem}>
              {renderMeditationItem(item, index)}
              {index < meditationHistory.length - 1 && (
                <View style={styles.meditationHistorySeparator} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Container & Layout
  container: {
    flex: 1,
  },
  
  // Navigation Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    fontFamily: 'System',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'System',
  },
  
  
  // Meditation History Scroll & Content
  meditationHistoryScroll: {
    flex: 1,
  },
  meditationHistoryContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  meditationHistoryList: {
    gap: 16,
  },
  meditationHistoryItem: {
    width: '100%',
  },
  meditationHistorySeparator: {
    height: 1,
    backgroundColor: '#E5E5E7',
    marginVertical: 8,
  },
  
  // Meditation History Cards
  meditationHistoryCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#F2F2F7',
  },
  meditationHistoryCardCompleted: {
    borderColor: '#34C759',
    backgroundColor: '#F0F9F0',
  },
  meditationHistoryCardSuggested: {
    borderColor: '#8E8E93',
    backgroundColor: '#F8F9FA',
  },
  meditationHistoryCardAvailable: {
    borderColor: '#007AFF',
    backgroundColor: '#F8F9FF',
  },
  
  // Status Indicators
  meditationStatusIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  meditationStatusIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  
  // Meditation Content
  meditationContent: {
    flex: 1,
    marginRight: 16,
  },
  meditationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
    lineHeight: 22,
    fontFamily: 'System',
  },
  meditationTitleSuggested: {
    color: '#8E8E93',
  },
  meditationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  meditationDuration: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'System',
    marginRight: 16,
  },
  meditationMetaSuggested: {
    color: '#C7C7CC',
  },
  meditationDate: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
    fontFamily: 'System',
  },
  meditationSuggestedLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    fontFamily: 'System',
  },
  
  // Action Icons
  meditationAction: {
    alignItems: 'center',
  },
  meditationCompletedIcon: {
    fontSize: 24,
  },
  meditationPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  meditationPlayIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'System',
    marginLeft: 1,
  },
  meditationExploreIcon: {
    fontSize: 20,
    color: '#8E8E93',
  },
  
  // Today Section
  todaySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  todaySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  todaySectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  todaySectionIconText: {
    fontSize: 20,
  },
  todaySectionHeaderText: {
    flex: 1,
  },
  todaySectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 4,
    fontFamily: 'System',
  },
  todaySectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'System',
  },
  
  // Today Sessions
  todaySessions: {
    gap: 12,
  },
  todaySessionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F2F2F7',
    position: 'relative',
  },
  todaySessionCardRecommended: {
    backgroundColor: '#F8F9FF',
    borderColor: '#007AFF',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendedBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'System',
  },
  todaySessionContent: {
    flex: 1,
    marginRight: 12,
  },
  todaySessionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
    lineHeight: 20,
    fontFamily: 'System',
  },
  todaySessionMeta: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 6,
    fontFamily: 'System',
  },
  recommendedLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'System',
  },
  todayPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  todayPlayIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'System',
    marginLeft: 1,
  },
});