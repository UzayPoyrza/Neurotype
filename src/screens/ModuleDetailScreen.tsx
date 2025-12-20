import React, { useMemo, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { SessionCard } from '../components/SessionCard';
import { Session } from '../types';
import { mentalHealthModules } from '../data/modules';
import { useStore } from '../store/useStore';
import { theme } from '../styles/theme';
import { getAllSessions, getSessionsByModality } from '../services/sessionService';
import { showErrorAlert, ERROR_TITLES } from '../utils/errorHandler';

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
  const cacheSessions = useStore(state => state.cacheSessions);
  
  // Session state from database
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

  // Fetch sessions from database based on module (only when module changes)
  useEffect(() => {
    const fetchSessions = async () => {
      console.log('[ModuleDetailScreen] 🔄 Starting to fetch sessions for module:', moduleId);
      setIsLoading(true);
      setError(null);
      
      try {
        let fetchedSessions: Session[] = [];
        
        // Handle liked meditations case - fetch all sessions and filter by liked
        if (moduleId === 'liked-meditations') {
          console.log('[ModuleDetailScreen] 📥 Fetching all sessions for liked meditations...');
          const allSessions = await getAllSessions();
          console.log('[ModuleDetailScreen] ✅ Fetched', allSessions.length, 'total sessions');
          // Only filter by likedSessionIds here - removingSessionIds is handled by moduleSessions useMemo
          fetchedSessions = allSessions.filter(session => 
            likedSessionIds.includes(session.id)
          );
          console.log('[ModuleDetailScreen] 🔍 Filtered to', fetchedSessions.length, 'liked sessions');
        } else if (module) {
          console.log('[ModuleDetailScreen] 📥 Fetching sessions by modality:', moduleId);
          fetchedSessions = await getSessionsByModality(moduleId);
          console.log('[ModuleDetailScreen] ✅ Fetched', fetchedSessions.length, 'sessions for modality', moduleId);
        }
        
        // Log session data to verify what we're getting
        if (fetchedSessions.length > 0) {
          console.log('[ModuleDetailScreen] 📋 Sample session data:', {
            id: fetchedSessions[0].id,
            title: fetchedSessions[0].title,
            hasDescription: !!fetchedSessions[0].description,
            hasWhyItWorks: !!fetchedSessions[0].whyItWorks,
            description: fetchedSessions[0].description?.substring(0, 50) + '...',
            whyItWorks: fetchedSessions[0].whyItWorks?.substring(0, 50) + '...',
          });
        }
        
        setSessions(fetchedSessions);
        // Cache all sessions with their full data (description, whyItWorks, thumbnail_url, etc.)
        console.log('[ModuleDetailScreen] 💾 Caching', fetchedSessions.length, 'sessions...');
        cacheSessions(fetchedSessions);
        console.log('[ModuleDetailScreen] ✅ Sessions cached successfully');
      } catch (err) {
        console.error('[ModuleDetailScreen] ❌ Error fetching sessions:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions';
        setError(errorMessage);
        showErrorAlert(ERROR_TITLES.NETWORK_ERROR, err);
      } finally {
        setIsLoading(false);
        console.log('[ModuleDetailScreen] ✨ Finished loading sessions');
      }
    };

    fetchSessions();
  }, [moduleId, module, cacheSessions]); // Only refetch when module changes, not on like/unlike or removal animation

  // Track previous likedSessionIds to detect if we're adding or removing
  const prevLikedSessionIdsRef = useRef<string[]>(likedSessionIds);
  
  // Background sync when likedSessionIds changes (only for adding new liked sessions)
  useEffect(() => {
    // Only sync for liked meditations module, and only if not currently loading
    if (moduleId === 'liked-meditations' && !isLoading) {
      const prevLikedIds = prevLikedSessionIdsRef.current;
      const isAdding = likedSessionIds.length > prevLikedIds.length;
      
      // INSTANT UPDATE: The moduleSessions useMemo already filters based on likedSessionIds
      // So unliking is instant - no state updates needed, just let useMemo handle it
      
      // If unliking, instantly update sessions state to remove unliked session (optimistic update)
      if (!isAdding) {
        // Immediately filter out unliked sessions from state (instant, no loading)
        const updatedSessions = sessions.filter(session => 
          likedSessionIds.includes(session.id) || removingSessionIds.has(session.id)
        );
        setSessions(updatedSessions);
        prevLikedSessionIdsRef.current = likedSessionIds;
        return; // Early return - skip all background processing for unliking
      }
      
      // Only do background sync if we're ADDING new likes
      if (isAdding) {
        const getCachedSession = useStore.getState().getCachedSession;
        const sessionCache = useStore.getState().sessionCache;
        const cachedSessionIds = Object.keys(sessionCache);
        
        // Find newly liked sessions that aren't in cache yet
        const newLikedIds = likedSessionIds.filter(id => !prevLikedIds.includes(id));
        const missingSessionIds = newLikedIds.filter(id => !cachedSessionIds.includes(id));
        
        if (missingSessionIds.length > 0) {
          // New liked sessions not in cache - fetch in background (silent, no loading screen)
          console.log('[ModuleDetailScreen] 📥 Background sync: Fetching', missingSessionIds.length, 'new liked sessions...');
          getAllSessions()
            .then(allSessions => {
              // Get the newly liked sessions
              const newSessions = allSessions.filter(session => 
                missingSessionIds.includes(session.id)
              );
              
              // Add to cache
              if (newSessions.length > 0) {
                cacheSessions(newSessions);
                console.log('[ModuleDetailScreen] ✅ Background sync: Cached', newSessions.length, 'new sessions');
              }
              
              // Update sessions list with all liked sessions (including new ones)
              const allLikedSessions = allSessions.filter(session => 
                likedSessionIds.includes(session.id)
              );
              setSessions(allLikedSessions);
            })
            .catch(err => {
              console.error('[ModuleDetailScreen] ❌ Background sync error (silent):', err);
              // Don't show error - UI already works with existing sessions
            });
        } else {
          // All new likes are already in cache, just update the sessions list
          const getCachedSession = useStore.getState().getCachedSession;
          const allLikedSessions = likedSessionIds
            .map(id => getCachedSession(id))
            .filter((session): session is Session => session !== null);
          setSessions(allLikedSessions);
        }
      }
      
      // Update ref for next comparison (only if we processed adding)
      prevLikedSessionIdsRef.current = likedSessionIds;
    }
  }, [likedSessionIds, moduleId, cacheSessions, isLoading]);

  // Filter sessions based on module type (for liked meditations with removing animation)
  const moduleSessions = useMemo(() => {
    if (moduleId === 'liked-meditations') {
      return sessions.filter(session => 
        likedSessionIds.includes(session.id) || removingSessionIds.has(session.id)
      );
    }
    return sessions;
  }, [sessions, moduleId, likedSessionIds, removingSessionIds]);

  const handleSessionStart = (session: Session) => {
    console.log('[ModuleDetailScreen] 👆 User clicked session:', session.id, session.title);
    // Navigate to MeditationDetail screen instead of setting active session
    console.log('[ModuleDetailScreen] 🚀 Navigating to MeditationDetail for session:', session.id);
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
            {moduleId === 'liked-meditations' 
              ? `${moduleSessions.length} favorite meditation${moduleSessions.length === 1 ? '' : 's'}`
              : module?.title
            }
          </Text>
          <Text style={styles.moduleDescription}>
            {moduleId === 'liked-meditations' 
              ? 'View hearted meditations'
              : module?.description
            }
          </Text>
        </View>
      </View>

      {/* Sessions List */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading sessions...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Error Loading Sessions</Text>
              <Text style={styles.emptySubtext}>{error}</Text>
            </View>
          </View>
        ) : (
          <>
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
          </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 17,
    color: '#8e8e93',
    fontWeight: '400',
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
    bottom: 90,
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