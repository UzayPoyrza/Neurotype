import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, TouchableOpacity, FlatList, AccessibilityInfo, TouchableWithoutFeedback, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Session } from '../types';
import { useStore, prerenderedModuleBackgrounds } from '../store/useStore';
import { mockSessions } from '../data/mockData';
import { mentalHealthModules } from '../data/modules';
import { theme } from '../styles/theme';
import { ModuleGridModal } from '../components/ModuleGridModal';
import { AnimatedFloatingButton } from '../components/AnimatedFloatingButton';
import { SessionBottomSheet } from '../components/SessionBottomSheet';
import { SessionProgressView } from '../components/SessionProgressView';
import { SessionRating } from '../components/SessionRating';
import { InfoBox } from '../components/InfoBox';
import { HowToUseModal } from '../components/HowToUseModal';
import { MeditationDetailModal } from '../components/MeditationDetailModal';
import { MergedCard } from '../components/MergedCard';
import { LineGraphIcon } from '../components/icons/LineGraphIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { ShimmerSessionCard, ShimmerAlternativeSessionCard, ShimmerProgressPathCard } from '../components/ShimmerSkeleton';
import { ensureDailyRecommendations, getDailyRecommendations } from '../services/recommendationService';
import { useUserId } from '../hooks/useUserId';
import { getSessionById } from '../services/sessionService';
import { getCompletedSessionsByDateRange, isSessionCompleted, getUserCompletedSessions } from '../services/progressService';
import { supabase } from '../services/supabase';

type SessionState = 'not_started' | 'in_progress' | 'completed' | 'rating';

type TodayStackParamList = {
  TodayMain: undefined;
  Roadmap: { recommendedSession?: Session };
  MeditationDetail: { sessionId: string };
  Player: undefined;
};

type TodayScreenNavigationProp = StackNavigationProp<TodayStackParamList, 'TodayMain'>;

export const TodayScreen: React.FC = () => {
  const navigation = useNavigation<TodayScreenNavigationProp>();
  const userId = useUserId();
  const { setActiveSession, setGlobalBackgroundColor, setCurrentScreen, setTodayModuleId, markSessionCompletedToday, isSessionCompletedToday } = useStore();
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  const userProgress = useStore(state => state.userProgress);
  
  // Module and session state management
  const [selectedModuleId, setSelectedModuleId] = useState('anxiety'); // Default to anxiety
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>('not_started');
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showMeditationModal, setShowMeditationModal] = useState(false);
  const [todayCompleted, setTodayCompleted] = useState(false);
  const [triggerUnlock, setTriggerUnlock] = useState(false);
  const [showRecommendationInfo, setShowRecommendationInfo] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isPillMode, setIsPillMode] = useState(false);
  const [lastFocusTime, setLastFocusTime] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [showInfoBox, setShowInfoBox] = useState(false);
  const [infoButtonActive, setInfoButtonActive] = useState(false);
  const [showHowToUseModal, setShowHowToUseModal] = useState(false);
  const [showModuleToast, setShowModuleToast] = useState(false);
  const [toastModuleName, setToastModuleName] = useState('');
  const [hoursUntilNewRecommendations, setHoursUntilNewRecommendations] = useState(0);
  const prevModuleIdRef = useRef<string | null>(null);
  const recommendationCheckInProgressRef = useRef<Record<string, boolean>>({});
  
  // Daily recommendations state
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  
  // Completed sessions for preview
  const [fetchedCompletedSessions, setFetchedCompletedSessions] = useState<Array<Session & { completedDate: string }>>([]);
  // All completed sessions for neuroadaptation counting (not limited to 3)
  const [allCompletedSessionsForCounting, setAllCompletedSessionsForCounting] = useState<Array<Session & { completedDate: string }>>([]);
  const [isLoadingCompletedSessions, setIsLoadingCompletedSessions] = useState(true);
  
  // Animation refs - simplified to avoid native driver conflicts
  const heroCardScale = useRef(new Animated.Value(1)).current;
  const completionAnimation = useRef(new Animated.Value(0)).current;
  const unlockAnimation = useRef(new Animated.Value(0)).current;
  const roadmapCardScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const moduleButtonFade = useRef(new Animated.Value(1)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;
  const floatingButtonOffset = useRef(new Animated.Value(0)).current;
  const hoursNumberScale = useRef(new Animated.Value(1)).current;
  
  const selectedModule = mentalHealthModules.find(m => m.id === selectedModuleId) || mentalHealthModules[0];
  
  // Update global background color when module changes
  useEffect(() => {
    const subtleColor = prerenderedModuleBackgrounds[selectedModuleId] || prerenderedModuleBackgrounds['anxiety'];
    setGlobalBackgroundColor(subtleColor);
    setTodayModuleId(selectedModuleId);
    
    // Show toast notification when module changes (not on initial mount)
    if (prevModuleIdRef.current !== null && prevModuleIdRef.current !== selectedModuleId) {
      const newModule = mentalHealthModules.find(m => m.id === selectedModuleId);
      if (newModule) {
        // Stop any existing animations
        toastAnim.stopAnimation();
        floatingButtonOffset.stopAnimation();
        
        // Reset animations
        toastAnim.setValue(0);
        floatingButtonOffset.setValue(0);
        
        setToastModuleName(newModule.title);
        setShowModuleToast(true);
        
        // Animate toast in and move floating button up
        Animated.parallel([
          Animated.sequence([
            Animated.timing(toastAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.delay(2000),
            Animated.timing(toastAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(floatingButtonOffset, {
              toValue: -40, // Move button up 40px
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.delay(2300), // Wait for toast to finish fading out (2000ms delay + 300ms fade out)
            Animated.timing(floatingButtonOffset, {
              toValue: 0, // Move button back down
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          setShowModuleToast(false);
        });
        
        // Check and generate recommendations for the new module
        // Don't force regenerate - check if recommendations exist first
        if (userId) {
          console.log('🎯 [TodayScreen] Module changed to:', selectedModuleId);
          
          // Prevent duplicate checks if one is already in progress
          if (recommendationCheckInProgressRef.current[selectedModuleId]) {
            console.log('⏳ [TodayScreen] Recommendation check already in progress for module:', selectedModuleId);
            return;
          }
          
          // Set loading state when module changes
          setIsLoadingRecommendations(true);
          recommendationCheckInProgressRef.current[selectedModuleId] = true;
          
          // Check if recommendations exist first, don't force regenerate
          ensureDailyRecommendations(userId, selectedModuleId, false).then(result => {
            if (result.success) {
              // Refetch recommendations (whether they were just generated or already existed)
              const refetchRecommendations = async () => {
                try {
                  const recommendations = await getDailyRecommendations(userId, selectedModuleId);
                  const sessionPromises = recommendations.map(async (rec) => {
                    const session = await getSessionById(rec.session_id);
                    if (session) {
                      return {
                        ...session,
                        isRecommended: rec.is_recommended,
                        adaptiveReason: rec.is_recommended ? 'Recommended for you' : 'Alternative option',
                      };
                    }
                    return null;
                  });
                  const sessions = (await Promise.all(sessionPromises)).filter(
                    (s): s is Session & { isRecommended: boolean; adaptiveReason: string } => s !== null
                  );
                  
                  // Check which recommended sessions are completed today (from cache)
                  // Note: We don't re-mark sessions here - syncTodayCompletedSessionsFromDatabase already
                  // populated the cache on app open. We just check the cache to show checkmarks.
                  const today = new Date().toISOString().split('T')[0];
                  console.log('✅ [TodayScreen] Checking completed sessions from cache after module change:', today);
                  
                  for (const session of sessions) {
                    const completed = isSessionCompletedToday(selectedModuleId, session.id, today);
                    if (completed) {
                      console.log('✅ [TodayScreen] Session completed today (from cache):', session.id, session.title);
                    }
                  }
                  
                  setTodaySessions(sessions);
                } catch (error) {
                  console.error('❌ [TodayScreen] Error refetching recommendations:', error);
                  setTodaySessions([]);
                } finally {
                  setIsLoadingRecommendations(false);
                  recommendationCheckInProgressRef.current[selectedModuleId] = false;
                }
              };
              
              if (result.generated) {
                console.log('✅ [TodayScreen] Generated new recommendations for module:', selectedModuleId);
              } else {
                console.log('✅ [TodayScreen] Using existing recommendations for today');
              }
              
              refetchRecommendations();
            } else {
              console.error('❌ [TodayScreen] Failed to ensure recommendations:', result.error);
              setIsLoadingRecommendations(false);
              recommendationCheckInProgressRef.current[selectedModuleId] = false;
            }
          }).catch((error) => {
            console.error('❌ [TodayScreen] Error in ensureDailyRecommendations:', error);
            setIsLoadingRecommendations(false);
            recommendationCheckInProgressRef.current[selectedModuleId] = false;
          });
        }
      }
    }
    
    // Update previous module ID ref
    prevModuleIdRef.current = selectedModuleId;
    
    // Cleanup animation on unmount
    return () => {
      toastAnim.stopAnimation();
      floatingButtonOffset.stopAnimation();
    };
  }, [selectedModuleId, setGlobalBackgroundColor, setTodayModuleId]);

  // Set screen context when component mounts or updates
  useEffect(() => {
    setCurrentScreen('today');
  }, [setCurrentScreen]);

  // Robust pill trigger function with delay
  const triggerPillAnimation = useCallback(() => {
    const currentTime = Date.now();
    
    // Prevent rapid successive triggers (debounce)
    if (currentTime - lastFocusTime < 500) {
      return;
    }
    
    setLastFocusTime(currentTime);
    setIsPillMode(false);
    
    // Start timer for pill mode
    const timer = setTimeout(() => {
      setIsPillMode(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [lastFocusTime]);

  // Immediate pill trigger function for scroll events
  const triggerPillAnimationImmediate = useCallback(() => {
    const currentTime = Date.now();
    
    // Prevent rapid successive triggers (debounce)
    if (currentTime - lastFocusTime < 500) {
      return;
    }
    
    setLastFocusTime(currentTime);
    setIsPillMode(false);
    
    // Trigger pill mode immediately
    setIsPillMode(true);
  }, [lastFocusTime]);

  // Handle drag start - cancel pill animation
  const handleDragStart = useCallback(() => {
    setIsPillMode(false);
  }, []);

  // Pill mode logic - trigger when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      triggerPillAnimation();
    }, [triggerPillAnimation])
  );

  // Trigger pill animation on focus
  useEffect(() => {
    triggerPillAnimation();
  }, [triggerPillAnimation]);

  // Auto-hide pill after 3 seconds
  useEffect(() => {
    if (isPillMode) {
      const timer = setTimeout(() => {
        setIsPillMode(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isPillMode]);

  // Note: Scroll-down pill hiding is now handled immediately in the scroll handler

  // Fetch daily recommendations from database
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!userId) {
        console.log('📋 [TodayScreen] No user ID, skipping recommendations fetch');
        setIsLoadingRecommendations(false);
        return;
      }

      console.log('📋 [TodayScreen] Fetching daily recommendations...');
      
      // Prevent duplicate checks if one is already in progress
      if (recommendationCheckInProgressRef.current[selectedModuleId]) {
        console.log('⏳ [TodayScreen] Recommendation check already in progress, skipping...');
        // Don't set loading to false - let the existing loading state persist
        return;
      }
      
      setIsLoadingRecommendations(true);
      
      recommendationCheckInProgressRef.current[selectedModuleId] = true;
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error('❌ [TodayScreen] Recommendations fetch timed out after 15 seconds');
        Alert.alert(
          'Timeout Error',
          'Loading recommendations is taking too long.\n\nPlease check your internet connection and try again.',
          [
            { text: 'Retry', onPress: () => {
              recommendationCheckInProgressRef.current[selectedModuleId] = false;
              fetchRecommendations();
            }},
            { text: 'OK', style: 'cancel', onPress: () => {
              setIsLoadingRecommendations(false);
              recommendationCheckInProgressRef.current[selectedModuleId] = false;
            }}
          ]
        );
        setIsLoadingRecommendations(false);
        recommendationCheckInProgressRef.current[selectedModuleId] = false;
        setTodaySessions([]);
      }, 15000); // 15 second timeout
      
      try {
        // Ensure recommendations exist for the current module
        const recResult = await ensureDailyRecommendations(userId, selectedModuleId, false);
        
        // ADD: Check if ensureDailyRecommendations failed
        if (!recResult.success) {
          console.error('❌ [TodayScreen] Failed to ensure recommendations:', recResult.error);
          Alert.alert(
            'Loading Error',
            `Failed to load recommendations.\n\nError: ${recResult.error || 'Unknown error'}\n\nPlease check your internet connection and try again.`,
            [
              { text: 'Retry', onPress: () => {
                recommendationCheckInProgressRef.current[selectedModuleId] = false;
                fetchRecommendations();
              }},
              { text: 'OK', style: 'cancel' }
            ]
          );
          setTodaySessions([]);
          setIsLoadingRecommendations(false);
          recommendationCheckInProgressRef.current[selectedModuleId] = false;
          return;
        }
        
        // Fetch recommendations for today and current module
        const recommendations = await getDailyRecommendations(userId, selectedModuleId);
        console.log('📋 [TodayScreen] Fetched', recommendations.length, 'recommendations for module:', selectedModuleId);
        
        // Ensure we only have max 4 recommendations
        if (recommendations.length > 4) {
          console.warn('⚠️ [TodayScreen] More than 4 recommendations found, limiting to 4');
        }
        
        if (recommendations.length === 0) {
          console.warn('⚠️ [TodayScreen] No recommendations found');
          // ADD: Show alert if no recommendations (might indicate an error)
          Alert.alert(
            'No Recommendations',
            'No recommendations found for today.\n\nThis might be a temporary issue. Please try again later.',
            [{ text: 'OK' }]
          );
          setTodaySessions([]);
          setIsLoadingRecommendations(false);
          return;
        }
        
        // Fetch session details for each recommendation
        const sessionPromises = recommendations.map(async (rec) => {
          const session = await getSessionById(rec.session_id);
          if (session) {
            return {
              ...session,
              isRecommended: rec.is_recommended,
              adaptiveReason: rec.is_recommended ? 'Recommended for you' : 'Alternative option',
            };
          }
          return null;
        });
        
        const sessions = (await Promise.all(sessionPromises)).filter(
          (s): s is Session & { isRecommended: boolean; adaptiveReason: string } => s !== null
        );
        
        console.log('📋 [TodayScreen] Loaded', sessions.length, 'sessions from recommendations');
        
        // ADD: Check if we got fewer sessions than recommendations (some failed to load)
        if (sessions.length < recommendations.length) {
          console.warn(`⚠️ [TodayScreen] Only loaded ${sessions.length} of ${recommendations.length} recommended sessions`);
          Alert.alert(
            'Partial Load',
            `Only ${sessions.length} of ${recommendations.length} sessions loaded successfully.\n\nSome sessions may be unavailable.`,
            [{ text: 'OK' }]
          );
        }
        
        // Only check completed sessions if recommendations were not regenerated (already existed)
        // This means the recommendations are stable and we should check completion status
        // Note: We don't re-mark sessions here - syncTodayCompletedSessionsFromDatabase already
        // populated the cache on app open. We just check the cache to show checkmarks.
        if (!recResult.generated) {
          const today = new Date().toISOString().split('T')[0];
          console.log('✅ [TodayScreen] Recommendations already exist, checking completion status from cache');
          
          // Check each recommended session if it's completed today (from cache)
          for (const session of sessions) {
            const completed = isSessionCompletedToday(selectedModuleId, session.id, today);
            if (completed) {
              console.log('✅ [TodayScreen] Session completed today (from cache):', session.id, session.title);
            }
          }
        } else {
          console.log('📋 [TodayScreen] Recommendations were just generated, skipping completion check');
        }
        
        setTodaySessions(sessions);
        clearTimeout(timeoutId); // Clear timeout on success
      } catch (error: any) {
        console.error('❌ [TodayScreen] Error fetching recommendations:', error);
        clearTimeout(timeoutId); // Clear timeout on error
        // Show detailed error alert
        Alert.alert(
          'Loading Error',
          `Failed to load recommendations.\n\nError: ${error?.message || 'Unknown error'}\nCode: ${error?.code || 'N/A'}\n\nPlease check your internet connection and try again.`,
          [
            { text: 'Retry', onPress: () => {
              recommendationCheckInProgressRef.current[selectedModuleId] = false;
              fetchRecommendations();
            }},
            { text: 'OK', style: 'cancel', onPress: () => {
              setIsLoadingRecommendations(false);
              recommendationCheckInProgressRef.current[selectedModuleId] = false;
            }}
          ]
        );
        setTodaySessions([]);
      } finally {
        // ALWAYS clear loading state and timeout, even if something goes wrong
        clearTimeout(timeoutId);
        setIsLoadingRecommendations(false);
        recommendationCheckInProgressRef.current[selectedModuleId] = false;
      }
    };

    fetchRecommendations();
  }, [userId, selectedModuleId]);

  // Fetch completed sessions for preview (up to 3 most recent)
  useEffect(() => {
    const fetchCompletedSessions = async () => {
      if (!userId) {
        setFetchedCompletedSessions([]);
        setAllCompletedSessionsForCounting([]);
        setIsLoadingCompletedSessions(false);
        return;
      }

      setIsLoadingCompletedSessions(true);
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error('❌ [TodayScreen] Completed sessions fetch timed out after 15 seconds');
        Alert.alert(
          'Timeout Error',
          'Loading completed sessions is taking too long.\n\nPlease check your internet connection.',
          [{ text: 'OK', onPress: () => {
            setIsLoadingCompletedSessions(false);
          }}]
        );
        setFetchedCompletedSessions([]);
        setAllCompletedSessionsForCounting([]);
        setIsLoadingCompletedSessions(false);
      }, 15000); // 15 second timeout
      
      try {
        // 1. Fetch ALL completed sessions (don't filter by context_module yet)
        const completedSessionsData = await getUserCompletedSessions(userId, 50);
        
        if (completedSessionsData.length === 0) {
          setFetchedCompletedSessions([]);
          setAllCompletedSessionsForCounting([]);
          return;
        }

        // 2. Get unique session IDs from all completed sessions
        const uniqueSessionIds = Array.from(
          new Set(completedSessionsData.map(cs => cs.session_id))
        );

        // 3. Batch fetch session_modalities for all unique sessions (1 query)
        const { data: modalitiesData, error: modalitiesError } = await supabase
          .from('session_modalities')
          .select('session_id, modality')
          .in('session_id', uniqueSessionIds);

        if (modalitiesError) {
          console.error('Error fetching session modalities:', modalitiesError);
          clearTimeout(timeoutId);
          Alert.alert(
            'Loading Error',
            `Failed to load completed sessions.\n\nError: ${modalitiesError.message || 'Unknown error'}\nCode: ${modalitiesError.code || 'N/A'}`,
            [{ text: 'OK' }]
          );
          setFetchedCompletedSessions([]);
          setAllCompletedSessionsForCounting([]);
          setIsLoadingCompletedSessions(false);
          return;
        }

        // 4. Create a map: session_id -> array of modules it belongs to
        const sessionModulesMap = new Map<string, string[]>();
        (modalitiesData || []).forEach(item => {
          if (!sessionModulesMap.has(item.session_id)) {
            sessionModulesMap.set(item.session_id, []);
          }
          sessionModulesMap.get(item.session_id)!.push(item.modality);
        });

        // 5. Batch fetch session details for all unique sessions (1 query)
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('id, title, duration_min, technique, description, why_it_works, audio_url, thumbnail_url, is_active')
          .in('id', uniqueSessionIds)
          .eq('is_active', true);

        if (sessionsError) {
          console.error('Error fetching sessions:', sessionsError);
          clearTimeout(timeoutId);
          Alert.alert(
            'Loading Error',
            `Failed to load session details.\n\nError: ${sessionsError.message || 'Unknown error'}\nCode: ${sessionsError.code || 'N/A'}`,
            [{ text: 'OK' }]
          );
          setFetchedCompletedSessions([]);
          setAllCompletedSessionsForCounting([]);
          setIsLoadingCompletedSessions(false);
          return;
        }

        // 6. Create a map: session_id -> session details
        const sessionsMap = new Map<string, any>();
        (sessionsData || []).forEach(session => {
          sessionsMap.set(session.id, {
            id: session.id,
            title: session.title,
            durationMin: session.duration_min,
            modality: session.technique,
            goal: 'anxiety' as any,
            description: session.description || undefined,
            whyItWorks: session.why_it_works || undefined,
            isRecommended: false,
            isTutorial: false,
          });
        });

        // 7. Filter: Include sessions that belong to current module (based on session_modalities)
        // Use completed_date from completed_sessions for dates
        const moduleCompletedSessions: Array<Session & { completedDate: string }> = [];
        const seenKeys = new Set<string>(); // Track seen keys to prevent duplicates
        
        for (const cs of completedSessionsData) {
          const sessionModules = sessionModulesMap.get(cs.session_id) || [];
          
          // Count this session if it belongs to the current module
          if (sessionModules.includes(selectedModuleId)) {
            const session = sessionsMap.get(cs.session_id);
            if (session) {
              // Create a unique key combining session_id and completed_date
              const completedDate = cs.completed_date || cs.created_at || new Date().toISOString().split('T')[0];
              const uniqueKey = `${cs.session_id}-${completedDate}`;
              
              // Skip if we've already added this exact completion
              if (!seenKeys.has(uniqueKey)) {
                seenKeys.add(uniqueKey);
                moduleCompletedSessions.push({
                  ...session,
                  completedDate: completedDate,
                });
              }
            }
          }
        }

        // 8. Sort by completed_date (most recent first)
        moduleCompletedSessions.sort((a, b) => {
          const dateA = new Date(a.completedDate).getTime();
          const dateB = new Date(b.completedDate).getTime();
          return dateB - dateA;
        });
        
        // Store all sessions for neuroadaptation counting
        setAllCompletedSessionsForCounting(moduleCompletedSessions);
        // Limit to 3 for display only
        setFetchedCompletedSessions(moduleCompletedSessions.slice(0, 3));
        clearTimeout(timeoutId); // Clear timeout on success
      } catch (error: any) {
        console.error('❌ [TodayScreen] Error fetching completed sessions:', error);
        clearTimeout(timeoutId); // Clear timeout on error
        Alert.alert(
          'Loading Error',
          `Failed to load completed sessions.\n\nError: ${error?.message || 'Unknown error'}\nCode: ${error?.code || 'N/A'}\n\nPlease check your internet connection.`,
          [{ text: 'OK' }]
        );
        setFetchedCompletedSessions([]);
        setAllCompletedSessionsForCounting([]);
      } finally {
        // ALWAYS clear loading state and timeout, even if something goes wrong
        clearTimeout(timeoutId);
        setIsLoadingCompletedSessions(false);
      }
    };

    fetchCompletedSessions();
  }, [userId, selectedModuleId]);

  const recommendedSession = todaySessions.find(s => s.isRecommended) || todaySessions[0];
  
  // Check if recommended session is completed
  const isRecommendedCompleted = recommendedSession 
    ? isSessionCompletedToday(selectedModuleId, recommendedSession.id)
    : false;
  
  const moduleSessionsForRoadmap = useMemo(() => {
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
    return mockSessions.filter(session => goals.includes(session.goal));
  }, [selectedModule]);

  // Use fetched completed sessions from database (already limited to 3 most recent)
  const completedPreviewSessions = useMemo(() => {
    return fetchedCompletedSessions;
  }, [fetchedCompletedSessions]);

  // Check if today's meditation is completed
  const isTodayCompleted = useMemo(() => {
    return todaySessions.some(session => {
      const originalSessionId = session.id.replace('-today', '');
      return isSessionCompletedToday(selectedModuleId, originalSessionId);
    });
  }, [todaySessions, selectedModuleId, isSessionCompletedToday]);

  // Filter to only count one session per day for neuroadaptation
  const uniqueDailySessionsCount = useMemo(() => {
    const seenDates = new Set<string>();
    
    for (const session of allCompletedSessionsForCounting) {
      const dateKey = new Date(session.completedDate).toDateString();
      seenDates.add(dateKey);
    }
    
    return seenDates.size;
  }, [allCompletedSessionsForCounting]);

  // Calculate timeline progress for preview
  const timelineProgress = useMemo(() => {
    const totalSessions = uniqueDailySessionsCount;
    
    // Calculate average sessions required based on time ranges (matching ModuleRoadmap)
    const milestones = [
      { title: 'Reduced amygdala activity', sessionsRequired: Math.round((5 + 7) / 2), timeRange: '5-7 daily sessions' }, // 6
      { title: 'Increased prefrontal cortex regulation', sessionsRequired: Math.round((3 * 7 + 4 * 7) / 2), timeRange: '3-4 weeks of daily sessions' }, // 25
      { title: 'Amygdala density reduction', sessionsRequired: Math.round((6 * 7 + 8 * 7) / 2), timeRange: '6–8 Weeks of daily sessions' }, // 49
      { title: 'Stronger frontal-limbic connectivity', sessionsRequired: Math.round(3 * 30.44), timeRange: '3 Months of daily sessions' }, // 91
      { title: 'Permanent structural changes', sessionsRequired: Math.round(6 * 30.44), timeRange: '6 Months of daily sessions' }, // 183
      { title: 'Deep neural transformation', sessionsRequired: 365, timeRange: '1 Year of daily sessions' },
    ];
    
    // Calculate progress for each milestone and find the highest progress one that isn't completed
    const milestoneProgresses = milestones.map(milestone => {
      const progress = Math.min(100, (totalSessions / milestone.sessionsRequired) * 100);
      const isCompleted = totalSessions >= milestone.sessionsRequired;
      return {
        milestone,
        progress,
        isCompleted,
      };
    });
    
    // Find the highest progress milestone that isn't completed
    const incompleteMilestones = milestoneProgresses.filter(m => !m.isCompleted);
    
    let highestProgressMilestone;
    let highestProgress;
    
    if (incompleteMilestones.length > 0) {
      // Find the one with highest progress
      const highest = incompleteMilestones.reduce((prev, current) => 
        current.progress > prev.progress ? current : prev
      );
      highestProgressMilestone = highest.milestone;
      highestProgress = highest.progress;
    } else {
      // All milestones completed, use the last one
      highestProgressMilestone = milestones[milestones.length - 1];
      highestProgress = 100;
    }
    
    const sessionsRemaining = highestProgress >= 100
      ? 0 
      : Math.max(0, highestProgressMilestone.sessionsRequired - totalSessions);
    
    return {
      totalSessions,
      nextMilestone: highestProgressMilestone,
      progress: highestProgress,
      sessionsRemaining,
    };
  }, [uniqueDailySessionsCount]);

  const formatCompletedLabel = useCallback((index: number) => {
    if (index === 0) return 'Yesterday';
    if (index === 1) return '2 days ago';

    const date = new Date();
    date.setDate(date.getDate() - (index + 1));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  const handleSessionSelect = (session: Session) => {
    setSelectedSession(session);
    
    // Remove the -today suffix to get the original session ID
    const originalSessionId = session.id.replace('-today', '');
    
    // Navigate to the new meditation detail screen
    navigation.navigate('MeditationDetail', { sessionId: originalSessionId });
  };

  const handleStartSession = () => {
    setShowMeditationModal(false);
    setSessionState('in_progress');
    if (selectedSession) {
      setActiveSession(selectedSession);
    }
  };

  const handleCloseMeditationModal = () => {
    setShowMeditationModal(false);
  };

  const handleTutorial = () => {
    // TODO: Implement tutorial functionality
    console.log('Tutorial requested for:', selectedSession?.title);
  };

  const handleSessionFinish = () => {
    setSessionState('rating');
  };

  const handleRatingSubmit = async (rating: number) => {
    // Mark session as completed in store
    if (selectedSession) {
      const originalSessionId = selectedSession.id.replace('-today', '');
      await markSessionCompletedToday(selectedModuleId, originalSessionId);
    }
    
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
    // Very quick scale down, then expand animation
    Animated.sequence([
      Animated.timing(roadmapCardScale, {
        toValue: 0.95,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(roadmapCardScale, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('Roadmap', { recommendedSession: recommendedSession || undefined });
      // Reset scale after navigation
      roadmapCardScale.setValue(1);
    });
  };

  const handleCancel = () => {
    setSelectedSession(null);
    setShowBottomSheet(false);
    setSessionState('not_started');
  };

  // Handle info box display
  const handleInfoPress = () => {
    setShowInfoBox(true);
    setInfoButtonActive(true);
  };

  const handleCloseInfoBox = () => {
    setShowInfoBox(false);
    setInfoButtonActive(false);
  };

  // Handle module button press with fade animation
  const handleModuleButtonPress = () => {
    // Quick fade out, then fade back in
    Animated.sequence([
      Animated.timing(moduleButtonFade, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(moduleButtonFade, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowModuleModal(true);
    });
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

  // Calculate hours until midnight (when new recommendations are generated)
  const calculateHoursUntilMidnight = useCallback(() => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diffMs = midnight.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, Math.ceil(diffHours));
  }, []);

  // Update hours until new recommendations
  useEffect(() => {
    const updateHours = () => {
      setHoursUntilNewRecommendations(calculateHoursUntilMidnight());
    };

    // Update immediately
    updateHours();

    // Update every minute to keep it accurate
    const interval = setInterval(updateHours, 60000);

    return () => clearInterval(interval);
  }, [calculateHoursUntilMidnight]);

  // Animate hours number pop every 6 seconds
  useEffect(() => {
    // Only animate if there are hours remaining (not 0)
    if (hoursUntilNewRecommendations === 0) {
      hoursNumberScale.setValue(1);
      return;
    }

    // Ensure starting value
    hoursNumberScale.setValue(1);

    const triggerPopAnimation = () => {
      // Reset to 1 to ensure clean animation
      hoursNumberScale.setValue(1);
      
      Animated.sequence([
        Animated.spring(hoursNumberScale, {
          toValue: 1.15,
          tension: 200,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(hoursNumberScale, {
          toValue: 1,
          tension: 200,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    };

    // Trigger after a short delay, then every 6 seconds
    const initialTimeout = setTimeout(() => {
      triggerPopAnimation();
    }, 1000);
    
    const interval = setInterval(triggerPopAnimation, 6000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [hoursUntilNewRecommendations, hoursNumberScale]);

  // Get current date info
  const getCurrentDateInfo = () => {
    const today = new Date();
    return {
      dayName: today.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: today.getDate(),
      monthName: today.toLocaleDateString('en-US', { month: 'short' }),
      fullDate: today.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })
    };
  };

  const renderTodayView = () => (
    <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
      {/* Sticky Header */}
      <View style={[styles.stickyHeader, { backgroundColor: globalBackgroundColor }]}>
        <Text style={styles.title}>Today</Text>
        
        {/* Info Button */}
        <View style={styles.infoWrapper}>
          <TouchableOpacity 
            style={[styles.infoButton, infoButtonActive && styles.infoButtonActive]}
            onPress={handleInfoPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.infoButtonText, infoButtonActive && styles.infoButtonTextActive]}>i</Text>
          </TouchableOpacity>
          
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        onScroll={(event) => {
          const currentScrollY = event.nativeEvent.contentOffset.y;
          setScrollY(currentScrollY);
          
          // Calculate if user is near the bottom only when content is scrollable
          const hasScrollableContent = contentHeight > scrollViewHeight + 80;
          const isAtBottom = hasScrollableContent &&
            (currentScrollY + scrollViewHeight) >= (contentHeight - 50);
          
          // Track if user has reached the bottom (reset more quickly)
          if (isAtBottom && !hasReachedBottom) {
            setHasReachedBottom(true);
          } else if (currentScrollY < (contentHeight - scrollViewHeight - 100) && hasReachedBottom) {
            // Reset when user scrolls 100px away from bottom
            setHasReachedBottom(false);
          }
          
          // Force pill to close when user reaches bottom
          if (isAtBottom && isPillMode) {
            setIsPillMode(false);
          }
          
          // Allow pill to open when scrolling up, with more permissive conditions
          if (currentScrollY < lastScrollY && 
              currentScrollY > 50 && 
              !isPillMode && 
              !isAtBottom) {
            // User is scrolling up, not at the very top, not at bottom
            triggerPillAnimationImmediate();
          }
          
          // Detect scroll direction and hide pill immediately when scrolling down
          if (currentScrollY > lastScrollY && currentScrollY > 50 && isPillMode) {
            // User is scrolling down and has scrolled past 50px, hide pill immediately
            setIsPillMode(false);
          }
          
          setLastScrollY(currentScrollY);
        }}
        onContentSizeChange={(contentWidth, contentHeight) => {
          setContentHeight(contentHeight);
        }}
        onLayout={(event) => {
          setScrollViewHeight(event.nativeEvent.layout.height);
        }}
        scrollEventThrottle={16}
      >

        <MergedCard>
          <MergedCard.Section style={styles.mergedSectionTop}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderTop}>
                <Text style={styles.cardTitle}>🧘‍♀️ Today's Focus</Text>
                <TouchableOpacity 
                  style={styles.moduleButton}
                  onPress={handleModuleButtonPress}
                  activeOpacity={1}
                >
                  <Animated.View style={{ opacity: moduleButtonFade, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.moduleIndicator, { backgroundColor: selectedModule.color }]} />
                    <Text style={styles.moduleButtonText}>{selectedModule.title}</Text>
                  </Animated.View>
                </TouchableOpacity>
              </View>
              <Text style={styles.focusSubtitle}>
                Personalized for your {selectedModule.title.toLowerCase()} journey
              </Text>
            </View>

            {/* Recommended Session */}
            {isLoadingRecommendations ? (
              <View style={styles.recommendedSessionContainer}>
                <ShimmerSessionCard />
              </View>
            ) : recommendedSession ? (
              <Animated.View
                style={[
                  styles.recommendedSessionContainer,
                  {
                    transform: [{ scale: heroCardScale }],
                  }
                ]}
              >
                <TouchableOpacity
                  style={[styles.recommendedSession, { 
                    backgroundColor: (todayCompleted || isRecommendedCompleted) ? 'rgba(0, 0, 0, 0.02)' : '#ffffff'
                  }]}
                  onPress={() => handleSessionSelect(recommendedSession)}
                  onPressIn={handleHeroCardPressIn}
                  onPressOut={handleHeroCardPressOut}
                  activeOpacity={1}
                >
                  <View style={styles.sessionContent}>
                    <Text style={styles.sessionTitle}>{recommendedSession.title}</Text>
                    <Text style={styles.sessionSubtitle}>
                      {recommendedSession.adaptiveReason || 'Recommended for you'}
                    </Text>
                    
                    <View style={styles.sessionMeta}>
                      <Text style={styles.sessionMetaText}>
                        {recommendedSession.durationMin} min • {recommendedSession.modality}
                      </Text>
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedBadgeText}>Recommended</Text>
                      </View>
                    </View>
                  </View>

                  {(todayCompleted || isRecommendedCompleted) ? (
                    <View style={[styles.sessionPlayButton, styles.sessionCompletedButton]}>
                      <Text style={styles.sessionCompletedCheckmark}>✓</Text>
                    </View>
                  ) : (
                    <View style={[styles.sessionPlayButton, { backgroundColor: selectedModule.color }]}>
                      <Text style={styles.sessionPlayText}>▶</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <View style={styles.recommendedSessionContainer}>
                <View style={[styles.recommendedSession, { backgroundColor: '#f2f2f7' }]}>
                  <Text style={styles.sessionTitle}>No recommendations available</Text>
                </View>
              </View>
            )}
          </MergedCard.Section>

          <MergedCard.Section style={styles.mergedSectionList} hideDividerBefore>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderTop}>
                <Text style={styles.cardTitle}>💡 Other Options</Text>
              </View>
            </View>
            
            <View style={styles.alternativeSessionsList}>
              {isLoadingRecommendations ? (
                <>
                  <ShimmerAlternativeSessionCard />
                  <ShimmerAlternativeSessionCard />
                  <ShimmerAlternativeSessionCard />
                </>
              ) : todaySessions.filter(s => !s.isRecommended).length > 0 ? (
                todaySessions.filter(s => !s.isRecommended).map((session) => {
                const isCompleted = isSessionCompletedToday(selectedModuleId, session.id);
                
                return (
                  <TouchableOpacity
                    key={session.id}
                    style={[
                      styles.alternativeSession,
                      isCompleted && {
                        ...styles.alternativeSessionCompleted,
                        backgroundColor: '#f2f2f7'
                      }
                    ]}
                    onPress={() => handleSessionSelect(session)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.alternativeSessionContent}>
                      <Text style={[
                        styles.alternativeSessionTitle,
                        isCompleted && styles.alternativeSessionTitleCompleted
                      ]}>
                        {session.title}
                      </Text>
                      <Text style={styles.alternativeSessionMeta}>
                        {session.durationMin} min • {session.modality}
                      </Text>
                    </View>
                    {isCompleted ? (
                      <View style={[styles.alternativeSessionPlayButton, styles.alternativeSessionCompletedButton]}>
                        <Text style={styles.alternativeSessionCompletedCheckmark}>✓</Text>
                      </View>
                    ) : (
                      <View style={styles.alternativeSessionPlayButton}>
                        <Text style={styles.alternativeSessionPlayTextUncompleted}>▶</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
              ) : (
                <View style={styles.alternativeSession}>
                  <Text style={styles.alternativeSessionTitle}>No alternative sessions available</Text>
                </View>
              )}
            </View>
          </MergedCard.Section>

          {/* Hours until new recommendations */}
          <MergedCard.Section style={styles.mergedSectionHours} hideDividerBefore>
            <View style={styles.hoursRemainingContainer}>
              <ClockIcon size={14} color="#8e8e93" />
              {hoursUntilNewRecommendations === 0 ? (
                <Text style={styles.hoursRemainingText}>
                  New recommendations available
                </Text>
              ) : hoursUntilNewRecommendations === 1 ? (
                <View style={styles.hoursRemainingTextRow}>
                  <Animated.View style={{ transform: [{ scale: hoursNumberScale }] }}>
                    <Text style={[styles.hoursRemainingText, styles.hoursRemainingTextBold]}>1 hour</Text>
                  </Animated.View>
                  <Text style={styles.hoursRemainingText}>
                    {' until new recommendations'}
                  </Text>
                </View>
              ) : (
                <View style={styles.hoursRemainingTextRow}>
                  <Animated.View style={{ transform: [{ scale: hoursNumberScale }] }}>
                    <Text style={[styles.hoursRemainingText, styles.hoursRemainingTextBold]}>{hoursUntilNewRecommendations} hours</Text>
                  </Animated.View>
                  <Text style={styles.hoursRemainingText}>
                    {' until new recommendations'}
                  </Text>
                </View>
              )}
            </View>
          </MergedCard.Section>
        </MergedCard>

        {/* Progress Path Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderTop}>
              <Text style={styles.cardTitle}>🗺️ Progress Path</Text>
            </View>
          </View>

          {isLoadingCompletedSessions ? (
            <View style={styles.progressPreviewContainer}>
              <ShimmerProgressPathCard />
            </View>
          ) : (
            <Animated.View
              style={[
                styles.progressPreviewContainer,
                {
                  transform: [{ scale: roadmapCardScale }],
                }
              ]}
            >
              <TouchableOpacity
                style={styles.progressPreviewCard}
                onPress={handleRoadmapCardPress}
                onPressIn={handleRoadmapCardPressIn}
                onPressOut={handleRoadmapCardPressOut}
                activeOpacity={1}
              >
              <View style={styles.progressPreviewHeader}>
                <View style={[styles.progressPreviewBadge, { backgroundColor: selectedModule.color }]}>
                  <LineGraphIcon size={24} color="#FFFFFF" accentColor="#FFFFFF" />
                </View>
                <View style={styles.progressPreviewHeaderText}>
                  <Text style={styles.progressPreviewTitle}>{selectedModule.title} Journey</Text>
                  <Text style={styles.progressPreviewSubtitle}>
                    See what you’ve completed and what’s next
                  </Text>
                </View>
              </View>

              <View style={styles.progressPreviewTimeline}>
                <View style={styles.progressPreviewColumn}>
                  <Text style={styles.progressPreviewSectionLabel}>Completed</Text>
                  {completedPreviewSessions.map((session, index) => {
                    // Calculate days ago from completion date
                    const completedDate = new Date((session as any).completedDate);
                    const today = new Date();
                    const daysDiff = Math.floor((today.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
                    
                    let dateLabel: string;
                    if (daysDiff === 0) {
                      dateLabel = 'Today';
                    } else if (daysDiff === 1) {
                      dateLabel = 'Yesterday';
                    } else if (daysDiff === 2) {
                      dateLabel = '2 days ago';
                    } else {
                      dateLabel = completedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }
                    
                    return (
                      <View key={`${session.id}-${session.completedDate}`} style={styles.progressPreviewItem}>
                        <View style={styles.progressPreviewItemIcon}>
                          <Text style={styles.progressPreviewItemIconText}>✓</Text>
                        </View>
                        <View style={styles.progressPreviewItemBody}>
                          <Text style={styles.progressPreviewItemTitle} numberOfLines={1}>
                            {session.title}
                          </Text>
                          <Text style={styles.progressPreviewItemMeta}>
                            {dateLabel}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                  {completedPreviewSessions.length === 0 && (
                    <View style={styles.progressPreviewLockedState}>
                      <View style={[styles.progressPreviewItemIcon, styles.progressPreviewItemIconLocked]}>
                        <Text style={styles.progressPreviewLockIconText}>🔒</Text>
                      </View>
                      <View style={styles.progressPreviewItemBody}>
                        <Text style={styles.progressPreviewLockedText}>
                          Complete a meditation to see it here
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.progressPreviewDivider} />

                <View style={styles.progressPreviewColumn}>
                  <Text style={styles.progressPreviewSectionLabel}>Coming Up</Text>
                  <View style={styles.progressPreviewLockedState}>
                    <View style={[styles.progressPreviewItemIcon, styles.progressPreviewItemIconLocked]}>
                      <Text style={styles.progressPreviewLockIconText}>🔒</Text>
                    </View>
                    <View style={styles.progressPreviewItemBody}>
                      <Text style={styles.progressPreviewLockedText}>
                        Feature coming soon
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Timeline Progress Preview */}
              <View style={styles.progressPreviewTimelineSection}>
                <View style={styles.progressPreviewTimelineHeader}>
                  <Text style={styles.progressPreviewTimelineLabel}>{timelineProgress.nextMilestone.title}</Text>
                  <Text style={[styles.progressPreviewTimelineProgress, { color: selectedModule.color }]}>
                    {Math.round(timelineProgress.progress)}%
                  </Text>
                </View>
                <View style={styles.progressPreviewTimelineBarContainer}>
                  <View style={styles.progressPreviewTimelineBarTrack}>
                    <View 
                      style={[
                        styles.progressPreviewTimelineBarFill,
                        {
                          width: `${timelineProgress.progress}%`,
                          backgroundColor: selectedModule.color,
                        }
                      ]} 
                    />
                  </View>
                </View>
                <Text style={styles.progressPreviewTimelineText}>
                  {timelineProgress.sessionsRemaining > 0 
                    ? `${timelineProgress.sessionsRemaining} more sessions to see full benefits`
                    : `Completed ${timelineProgress.nextMilestone.title}`}
                </Text>
              </View>

              <View style={styles.progressPreviewFooter}>
                <Text style={styles.progressPreviewFooterText}>
                  Tap to open your full progress path
                </Text>
                <Text style={[styles.progressPreviewFooterArrow, { color: selectedModule.color }]}>›</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
        </ScrollView>
    </View>
  );

  return (
    <>
      {renderTodayView()}

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

      {/* Meditation Detail Modal */}
      <MeditationDetailModal
        session={selectedSession}
        isVisible={showMeditationModal}
        onClose={handleCloseMeditationModal}
        onStart={handleStartSession}
        onTutorial={handleTutorial}
      />

      {/* Animated Floating Button - Fixed to Screen */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'box-none',
          transform: [{ translateY: floatingButtonOffset }],
        }}
      >
        <AnimatedFloatingButton
          backgroundColor={selectedModule.color}
          onPress={() => setShowModuleModal(true)}
          isPillMode={isPillMode}
          onScroll={(scrollY) => setScrollY(scrollY)}
          onDragStart={handleDragStart}
        />
      </Animated.View>

      {/* Info Box */}
      <InfoBox
        isVisible={showInfoBox}
        onClose={handleCloseInfoBox}
        title="About Today"
        content="Our Today page uses evidence-based approaches to mental wellness. Each session is designed using proven techniques from cognitive behavioral therapy, mindfulness research, and neuroscience. Personalized recommendations adapt to your progress and preferences, helping you build sustainable mental health habits."
        position={{ top: 105, right: 20 }}
        onHowToUsePress={() => setShowHowToUseModal(true)}
      />

      {/* How to Use Modal */}
      <HowToUseModal
        isVisible={showHowToUseModal}
        onClose={() => setShowHowToUseModal(false)}
      />

      {/* Module Switch Toast */}
      {showModuleToast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: toastAnim,
              transform: [{
                translateY: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.toastText}>
            Switched to <Text style={styles.toastModuleName}>{toastModuleName}</Text> module
          </Text>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  ...theme.health, // Use global Apple Health styles
  stickyHeader: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 5,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: 120, // Account for shorter sticky header height
  },
  moduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  moduleIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  moduleButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  recommendedBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  recommendedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  mergedSectionTop: {
    paddingTop: 0,
  },
  mergedSectionList: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  focusSubtitle: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
    marginBottom: 0,
  },
  recommendedSessionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  recommendedSession: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
    minHeight: 88, // Standardized height
  },
  sessionContent: {
    flex: 1,
    marginRight: 16,
  },
  sessionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  sessionSubtitle: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  sessionMeta: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionMetaText: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '400',
  },
  mergedSectionHours: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  hoursRemainingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  hoursRemainingText: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  hoursRemainingTextBold: {
    fontWeight: '700',
  },
  hoursRemainingTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  sessionPlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionPlayText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  sessionCompletedButton: {
    backgroundColor: '#34c759',
  },
  sessionCompletedCheckmark: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  alternativeSessionsList: {
    paddingTop: 0,
    paddingBottom: 12,
  },
  alternativeSession: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 64, // Standardized height to match recommendedSession proportions
  },
  alternativeSessionCompleted: {
    borderColor: 'transparent',
  },
  alternativeSessionContent: {
    flex: 1,
    marginRight: 16,
  },
  alternativeSessionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  alternativeSessionTitleCompleted: {
    color: '#1d1d1f',
    opacity: 0.8,
  },
  alternativeSessionMeta: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '400',
  },
  alternativeSessionPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f2f2f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alternativeSessionPlayText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  alternativeSessionCompletedButton: {
    backgroundColor: '#34c759',
  },
  alternativeSessionCompletedCheckmark: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  alternativeSessionPlayTextUncompleted: {
    fontSize: 12,
    color: '#000000',
    fontWeight: 'bold',
    marginLeft: 1,
  },
  progressPreviewContainer: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 20,
  },
  progressPreviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  progressPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressPreviewBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  progressPreviewHeaderText: {
    flex: 1,
  },
  progressPreviewTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  progressPreviewSubtitle: {
    fontSize: 14,
    color: '#8e8e93',
  },
  progressPreviewTimeline: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f2f2f7',
    backgroundColor: '#f9f9fb',
    paddingHorizontal: 14,
    paddingVertical: 18,
    marginBottom: 16,
  },
  progressPreviewColumn: {
    flex: 1,
  },
  progressPreviewSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  progressPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressPreviewItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#34c759',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  progressPreviewItemIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  progressPreviewLockIconText: {
    fontSize: 20,
  },
  progressPreviewItemBody: {
    flex: 1,
  },
  progressPreviewItemTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1d1d1f',
  },
  progressPreviewItemMeta: {
    fontSize: 12,
    color: '#8e8e93',
  },
  progressPreviewLockedState: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  progressPreviewItemIconLocked: {
    backgroundColor: '#f2f2f7',
    borderWidth: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  progressPreviewLockedText: {
    fontSize: 12,
    color: '#8e8e93',
    lineHeight: 16,
    marginTop: 2,
  },
  progressPreviewDivider: {
    width: 1,
    backgroundColor: '#e5e5ea',
    marginHorizontal: 12,
    borderRadius: 0.5,
  },
  progressPreviewItemIconUpcoming: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d1d6',
  },
  progressPreviewItemIconUpcomingText: {
    color: '#1d1d1f',
  },
  progressPreviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPreviewFooterText: {
    fontSize: 13,
    color: '#8e8e93',
    fontStyle: 'italic',
  },
  progressPreviewFooterArrow: {
    fontSize: 20,
    fontWeight: '600',
  },
  progressPreviewTimelineSection: {
    marginTop: 16,
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f2f2f7',
  },
  progressPreviewTimelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressPreviewTimelineLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  progressPreviewTimelineProgress: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressPreviewTimelineBarContainer: {
    marginBottom: 6,
  },
  progressPreviewTimelineBarTrack: {
    height: 6,
    backgroundColor: '#e5e5ea',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressPreviewTimelineBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPreviewTimelineText: {
    fontSize: 12,
    color: '#8e8e93',
  },
  bottomSpacing: {
    height: 120,
  },
  
  // Info Button & Box
  infoWrapper: {
    position: 'relative',
  },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
  },
  infoButtonActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  infoButtonTextActive: {
    color: '#007AFF',
  },
  toastContainer: {
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
  toastContent: {
    // Not needed - styles are on container
  },
  toastText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  toastModuleName: {
    fontWeight: '600',
    color: '#ffffff',
  },
}); 