import React, { useMemo, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { SessionCard } from '../components/SessionCard';
import { Session } from '../types';
import { mockSessions } from '../data/mockData';
import { mentalHealthModules } from '../data/modules';
import { useStore } from '../store/useStore';
import { theme } from '../styles/theme';

type ExploreStackParamList = {
  ExploreMain: undefined;
  ModuleDetail: { moduleId: string };
  MeditationDetail: { sessionId: string };
};

type ModuleDetailRouteProp = RouteProp<ExploreStackParamList, 'ModuleDetail'>;
type ModuleDetailNavigationProp = StackNavigationProp<ExploreStackParamList, 'ModuleDetail'>;

interface ModuleDetailScreenProps {}

// Animated wrapper for SessionCard to handle removal animation
const AnimatedSessionCard: React.FC<{
  session: Session;
  onStart: () => void;
  variant: 'list';
  onLike: (isLiked: boolean) => void;
  isRemoving: boolean;
}> = ({ session, onStart, variant, onLike, isRemoving }) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (isRemoving) {
      // Animate out: fade and slide to the right
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 300,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset for new items
      opacity.setValue(1);
      translateX.setValue(0);
    }
  }, [isRemoving]);
  
  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateX }],
      }}
    >
      <SessionCard
        session={session}
        onStart={onStart}
        variant={variant}
        onLike={onLike}
      />
    </Animated.View>
  );
};

export const ModuleDetailScreen: React.FC<ModuleDetailScreenProps> = () => {
  const route = useRoute<ModuleDetailRouteProp>();
  const navigation = useNavigation<ModuleDetailNavigationProp>();
  const setCurrentScreen = useStore(state => state.setCurrentScreen);
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  
  const { moduleId } = route.params;
  const module = mentalHealthModules.find(m => m.id === moduleId);
  const likedSessionIds = useStore(state => state.likedSessionIds);
  
  // Message state for "Added to Liked meditations" or "Removed from Liked meditations"
  const [showAddedMessage, setShowAddedMessage] = useState(false);
  const [isLikedAction, setIsLikedAction] = useState(true); // true = added, false = removed
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track sessions that are being removed (for animation)
  const [removingSessionIds, setRemovingSessionIds] = useState<Set<string>>(new Set());
  
  const handleLike = (isLiked: boolean, sessionId?: string) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Stop any ongoing animation
    fadeAnim.stopAnimation();
    
    // Reset animation value
    fadeAnim.setValue(0);
    
    // Set the action type and show message
    setIsLikedAction(isLiked);
    setShowAddedMessage(true);
    
    // If unliking and we're in the liked meditations module, animate removal
    if (!isLiked && moduleId === 'liked-meditations' && sessionId) {
      setRemovingSessionIds(prev => new Set(prev).add(sessionId));
      // Remove from removing set after animation completes
      setTimeout(() => {
        setRemovingSessionIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(sessionId);
          return newSet;
        });
      }, 300);
    }
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Fade out after 2 seconds
    timeoutRef.current = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowAddedMessage(false);
      });
    }, 2000);
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Set screen context when component mounts
  useEffect(() => {
    setCurrentScreen('module-detail');
  }, [setCurrentScreen]);

  // Restore screen context when component unmounts
  useEffect(() => {
    return () => {
      setCurrentScreen('explore');
    };
  }, [setCurrentScreen]);
  
  // Filter sessions based on module type
  const moduleSessions = useMemo(() => {
    // Handle liked meditations case
    if (moduleId === 'liked-meditations') {
      return mockSessions.filter(session => 
        likedSessionIds.includes(session.id) || removingSessionIds.has(session.id)
      );
    }
    
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
  }, [moduleId, module, likedSessionIds, removingSessionIds]);

  const handleSessionStart = (session: Session) => {
    // Navigate to MeditationDetail screen instead of setting active session
    navigation.navigate('MeditationDetail', { sessionId: session.id });
  };

  if (!module && moduleId !== 'liked-meditations') {
    return (
      <View style={[styles.container, { backgroundColor: '#f2f2f7' }]}>
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
    <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={[styles.moduleIcon, { backgroundColor: moduleId === 'liked-meditations' ? '#E74C3C' : module?.color }]}>
            <Text style={styles.moduleIconText}>
              {moduleId === 'liked-meditations' ? '❤️' : module?.title.charAt(0)}
            </Text>
          </View>
          <Text style={styles.moduleTitle}>
            {moduleId === 'liked-meditations' ? 'Liked Meditations' : module?.title}
          </Text>
          <Text style={styles.moduleDescription}>
            {moduleId === 'liked-meditations' 
              ? `${moduleSessions.length} favorite meditation session${moduleSessions.length === 1 ? '' : 's'}`
              : module?.description
            }
          </Text>
        </View>
      </View>

      {/* Sessions List */}
      <View style={styles.content}>
        <FlatList
          data={moduleSessions}
          renderItem={({ item }) => {
            const isRemoving = removingSessionIds.has(item.id);
            return (
              <AnimatedSessionCard
                session={item}
                onStart={() => handleSessionStart(item)}
                variant="list"
                onLike={(isLiked) => handleLike(isLiked, item.id)}
                isRemoving={isRemoving}
              />
            );
          }}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
        />

        {moduleSessions.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {moduleId === 'liked-meditations' ? 'No Liked Meditations' : 'Coming Soon'}
              </Text>
              <Text style={styles.emptySubtext}>
                {moduleId === 'liked-meditations' 
                  ? 'Heart meditations you enjoy to see them here'
                  : `Meditations for ${module?.title} are being prepared`
                }
              </Text>
            </View>
          </View>
        )}
      </View>
      
      {/* Added/Removed from Liked meditations message */}
      {showAddedMessage && (
        <Animated.View 
          style={[
            styles.addedMessage,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.addedMessageText}>
            {isLikedAction ? 'Added to Liked meditations' : 'Removed from Liked meditations'}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60, // Account for status bar
    paddingBottom: 24,
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
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: -60, // Move content up to align icon with back button top
  },
  moduleIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moduleIconText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  moduleTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  moduleDescription: {
    fontSize: 17,
    fontWeight: '400',
    color: '#8e8e93',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#8e8e93',
  },
  listContainer: {
    paddingBottom: 100,
  },
  emptyStateContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyText: {
    color: '#000000',
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 17,
    fontWeight: '400',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 19,
    fontWeight: '600',
    color: '#000000',
  },
  addedMessage: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  addedMessageText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});