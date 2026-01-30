import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  TouchableWithoutFeedback,
  Share,
  ActivityIndicator,
} from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Session } from '../types';
import { theme } from '../styles/theme';
import { useStore, prerenderedModuleBackgrounds } from '../store/useStore';
import { ShareIcon, BookOpenIcon } from '../components/icons';
import { DraggableActionBar } from '../components/DraggableActionBar';
import { meditationAudioData } from '../data/meditationMockData';
import { getSessionById, getSessionModules } from '../services/sessionService';
import { ShimmerMeditationDetailMedia, ShimmerMeditationDetailContent, ShimmerSkeleton } from '../components/ShimmerSkeleton';
import { mentalHealthModules, getCategoryColor, MentalHealthModule } from '../data/modules';
import { useUserId } from '../hooks/useUserId';
import { supabase } from '../services/supabase';

type MeditationDetailStackParamList = {
  MeditationDetail: {
    sessionId: string;
  };
};

type MeditationDetailRouteProp = RouteProp<MeditationDetailStackParamList, 'MeditationDetail'>;
type MeditationDetailNavigationProp = StackNavigationProp<MeditationDetailStackParamList, 'MeditationDetail'>;

interface MeditationDetailScreenProps {}

type TabType = 'summary' | 'history' | 'howto';

export const MeditationDetailScreen: React.FC<MeditationDetailScreenProps> = () => {
  const navigation = useNavigation<MeditationDetailNavigationProp>();
  const route = useRoute<MeditationDetailRouteProp>();
  const { sessionId } = route.params;
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  const setActiveSession = useStore(state => state.setActiveSession);
  const getCachedSession = useStore(state => state.getCachedSession);
  const cacheSessions = useStore(state => state.cacheSessions);
  
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionModules, setSessionModules] = useState<string[]>([]);
  const [sessionHistory, setSessionHistory] = useState<Array<{ id: string; duration: number; date: string; time: string; dateObj: Date }>>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasFetchedHistory, setHasFetchedHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [historySortOrder, setHistorySortOrder] = useState<'latest' | 'earliest'>('latest');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const userId = useUserId();
  const scrollX = useRef(new Animated.Value(0)).current;
  const horizontalScrollRef = useRef<ScrollView>(null);
  const draggableActionBarRef = useRef<any>(null);
  const horizontalScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isShareSheetOpen, setShareSheetOpen] = useState(false);
  const shareSheetProgress = useSharedValue(0);

  // Animated styles for share sheet using reanimated
  const shareBackdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: shareSheetProgress.value,
    };
  });

  const shareSheetAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      shareSheetProgress.value,
      [0, 1],
      [320, 0],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY }],
    };
  });
  const screenWidth = Dimensions.get('window').width;
  
  // Load session from cache or database
  useEffect(() => {
    const loadSession = async () => {
      console.log('[MeditationDetailScreen] 🔄 Loading session:', sessionId);
      setIsLoading(true);
      
      // First check cache (pre-rendered when module was loaded)
      console.log('[MeditationDetailScreen] 🔍 Checking cache for session:', sessionId);
      const cachedSession = getCachedSession(sessionId);
      if (cachedSession) {
        console.log('[MeditationDetailScreen] ✅ Found in cache! Using cached session:', {
          id: cachedSession.id,
          title: cachedSession.title,
          hasDescription: !!cachedSession.description,
          hasWhyItWorks: !!cachedSession.whyItWorks,
          description: cachedSession.description?.substring(0, 50) + '...',
          whyItWorks: cachedSession.whyItWorks?.substring(0, 50) + '...',
        });
        console.log('[MeditationDetailScreen] 📄 Full cached session object:', JSON.stringify(cachedSession, null, 2));
        
        // Check if cached session is complete (has description and whyItWorks)
        const isComplete = cachedSession.description && cachedSession.whyItWorks;
        
        if (isComplete) {
          // Use complete cached session
          setSession(cachedSession);
          
          // Fetch modules for this session even if cached
          const modules = await getSessionModules(sessionId);
          console.log('[MeditationDetailScreen] 📦 Fetched modules:', modules);
          setSessionModules(modules);
          
          setIsLoading(false);
          return;
        } else {
          // Cached session is incomplete, fetch full data from database
          console.log('[MeditationDetailScreen] ⚠️ Cached session is incomplete, fetching full data from database...');
        }
      }
      
      // If not in cache, fetch from database
      console.log('[MeditationDetailScreen] 📥 Session not in cache, fetching from database...');
      try {
        const fetchedSession = await getSessionById(sessionId);
        if (fetchedSession) {
          console.log('[MeditationDetailScreen] ✅ Fetched from database:', {
            id: fetchedSession.id,
            title: fetchedSession.title,
            hasDescription: !!fetchedSession.description,
            hasWhyItWorks: !!fetchedSession.whyItWorks,
            description: fetchedSession.description?.substring(0, 50) + '...',
            whyItWorks: fetchedSession.whyItWorks?.substring(0, 50) + '...',
          });
          console.log('[MeditationDetailScreen] 📄 Full fetched session object:', JSON.stringify(fetchedSession, null, 2));
          setSession(fetchedSession);
          // Cache for future use
          console.log('[MeditationDetailScreen] 💾 Caching fetched session...');
          cacheSessions([fetchedSession]);
          
          // Fetch modules for this session
          const modules = await getSessionModules(sessionId);
          console.log('[MeditationDetailScreen] 📦 Fetched modules:', modules);
          setSessionModules(modules);
        } else {
          console.log('[MeditationDetailScreen] ⚠️ Session not found in database');
        }
      } catch (error) {
        console.error('[MeditationDetailScreen] ❌ Error fetching session:', error);
      } finally {
        setIsLoading(false);
        console.log('[MeditationDetailScreen] ✨ Finished loading session');
      }
    };

    loadSession();
  }, [sessionId, getCachedSession, cacheSessions]);

  // Log when session state changes
  useEffect(() => {
    if (session) {
      console.log('[MeditationDetailScreen] 📊 Session state updated:', {
        id: session.id,
        title: session.title,
        hasDescription: !!session.description,
        hasWhyItWorks: !!session.whyItWorks,
        description: session.description,
        whyItWorks: session.whyItWorks,
        fullSession: session,
      });
    } else {
      console.log('[MeditationDetailScreen] ⚠️ Session is null');
    }
  }, [session]);

  // Fetch session history only when user enters history tab
  useEffect(() => {
    const fetchSessionHistory = async () => {
      // Only fetch if user is on history tab and hasn't fetched yet
      if (activeTab !== 'history' || hasFetchedHistory) {
        return;
      }

      if (!sessionId || !userId) {
        setSessionHistory([]);
        setIsLoadingHistory(false);
        setHasFetchedHistory(true);
        return;
      }

      setIsLoadingHistory(true);
      try {
        console.log('[MeditationDetailScreen] 📜 Fetching history for session:', sessionId);
        
        const { data, error } = await supabase
          .from('completed_sessions')
          .select('*')
          .eq('user_id', userId)
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[MeditationDetailScreen] ❌ Error fetching session history:', error);
          setSessionHistory([]);
          setHasFetchedHistory(true);
          return;
        }

        console.log('[MeditationDetailScreen] ✅ Fetched', data?.length || 0, 'history entries');

        // Format the history data
        const formattedHistory = (data || []).map((entry) => {
          const completedDate = new Date(entry.completed_date || entry.created_at);
          const dateStr = completedDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          });
          const timeStr = completedDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });

          return {
            id: entry.id,
            duration: Math.round(entry.minutes_completed || 0),
            date: dateStr,
            time: timeStr,
            dateObj: completedDate,
          };
        });

        setSessionHistory(formattedHistory);
        setHasFetchedHistory(true);
      } catch (error) {
        console.error('[MeditationDetailScreen] ❌ Error in fetchSessionHistory:', error);
        setSessionHistory([]);
        setHasFetchedHistory(true);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchSessionHistory();
  }, [activeTab, sessionId, userId, hasFetchedHistory]);

  const hasTutorial = !!(session && (meditationAudioData[session.id as keyof typeof meditationAudioData] as any)?.tutorialBackgroundAudio);
  const sessionShareLink = session ? `https://www.neurotypeapp.com/sessions/${session.id}` : '';
  const formattedGoal = session ? session.goal.charAt(0).toUpperCase() + session.goal.slice(1) : '';
  
  const handleTabChange = (tab: TabType) => {
    const tabIndex = tab === 'summary' ? 0 : tab === 'history' ? 1 : 2;
    
    // Scroll to the appropriate page
    horizontalScrollRef.current?.scrollTo({
      x: tabIndex * screenWidth,
      animated: true,
    });
    
    setActiveTab(tab);
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    
    // Update scrollX animated value for tab indicator
    scrollX.setValue(offsetX);
    
    // Trigger button animation to circle mode during horizontal scrolling
    if (draggableActionBarRef.current) {
      draggableActionBarRef.current.handleScroll(Math.abs(offsetX)); // Pass actual scroll amount
    }
    
    const tabIndex = Math.round(offsetX / screenWidth);
    
    // Update active tab based on scroll position
    const newTab = tabIndex === 0 ? 'summary' : tabIndex === 1 ? 'history' : 'howto';
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  };

  const handleScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const maxScrollX = screenWidth * 2; // Maximum scroll position (How-to page)
    
    // Check if we're at the left edge (Summary page) and scrolled beyond it
    if (offsetX < -30) {
      // Navigate back to Today page
      navigation.goBack();
      return;
    }
    
    // Check if we're at the right edge (How-to page) and scrolled beyond it
    if (offsetX > maxScrollX + 30) {
      // Snap back to the How-to page
      horizontalScrollRef.current?.scrollTo({
        x: maxScrollX,
        animated: true,
      });
    }
  };

  const handleMomentumScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    
    // Check if we're at the left edge (Summary page) and scrolled beyond it
    if (offsetX < -30) {
      // Navigate back to Today page
      navigation.goBack();
    }
  };

  const handleVerticalScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    
    // Pass scroll event to DraggableActionBar
    if (draggableActionBarRef.current) {
      draggableActionBarRef.current.handleScroll(scrollY);
    }
  };

  const handleTutorialPress = () => {
    // Start tutorial mode for the meditation session
    if (session) {
      // Set a flag to indicate this is a tutorial session
      const tutorialSession = { ...session, isTutorial: true };
      setActiveSession(tutorialSession);
    }
  };

  const handleStatsPress = () => {
    // Navigate to stats or show stats modal
    console.log('Stats pressed for:', session?.title);
    // You can implement stats functionality here
  };

  const handleStartPress = () => {
    // Start the meditation session
    if (session) {
      setActiveSession(session);
    }
  };

  const openShareSheet = () => {
    if (isShareSheetOpen) {
      return;
    }
    setShareSheetOpen(true);
    shareSheetProgress.value = 0;
    shareSheetProgress.value = withSpring(1, {
      damping: 20,
      stiffness: 300,
      mass: 0.8,
    });
  };

  const closeShareSheet = () => {
    shareSheetProgress.value = withTiming(0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
    // Delay setting state to allow animation to complete
    setTimeout(() => {
      setShareSheetOpen(false);
    }, 200);
  };

  const handleSharePress = () => {
    openShareSheet();
  };

  const handleCloseShareSheet = () => {
    closeShareSheet();
  };

  const handleShareSession = async () => {
    if (!session) {
      return;
    }

    try {
      await Share.share({
        title: session.title,
        message: `Check out the meditation "${session.title}" on Neurotype.\n${sessionShareLink}`,
        url: sessionShareLink,
      });
    } catch (error) {
      console.error('Error sharing meditation:', error);
    } finally {
      closeShareSheet();
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          {/* Sticky Header */}
          <View style={styles.stickyHeader}>
            <View style={styles.headerContent}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <ShimmerSkeleton width="60%" height={17} borderRadius={6} />
              <View style={styles.headerActions}>
                <View style={{ width: 24, height: 24 }} />
              </View>
            </View>
            
            {/* Tabs in Header */}
            <View style={styles.tabsContainer}>
              <View style={styles.tab}>
                <ShimmerSkeleton width={60} height={15} borderRadius={6} />
              </View>
              <View style={styles.tab}>
                <ShimmerSkeleton width={60} height={15} borderRadius={6} />
              </View>
              <View style={styles.tab}>
                <ShimmerSkeleton width={60} height={15} borderRadius={6} />
              </View>
            </View>
          </View>

          {/* Horizontal ScrollView for pages */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            style={styles.horizontalScrollView}
            bounces={false}
          >
            {/* Summary Page */}
            <ScrollView 
              style={[styles.page, { width: screenWidth }]} 
              contentContainerStyle={styles.pageContent}
              scrollEventThrottle={16}
            >
              <ShimmerMeditationDetailMedia />
              <ShimmerMeditationDetailContent />
            </ScrollView>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Meditation not found</Text>
      </View>
    );
  }

  const getModalityIcon = (modality: string) => {
    const icons: { [key: string]: string } = {
      sound: '🔊',
      movement: '🏃',
      mantra: '🕉️',
      visualization: '👁️',
      somatic: '🤲',
      mindfulness: '🌸',
      breathing: '💨',
    };
    return icons[modality.toLowerCase()] || '🎯';
  };

  const getModalityColor = (modality: string) => {
    switch (modality.toLowerCase()) {
      case 'movement':
        return '#ff9500'; // Orange
      case 'somatic':
        return '#34c759'; // Green  
      case 'breathing':
        return '#007aff'; // Blue
      case 'visualization':
        return '#af52de'; // Purple
      case 'mindfulness':
        return '#ff2d92'; // Pink
      case 'sound':
        return '#007aff'; // Blue
      case 'mantra':
        return '#af52de'; // Purple
      default:
        return '#8e8e93'; // Gray
    }
  };

  const getGoalColor = (goal: string) => {
    // Map goals to their category colors (matching modules.ts categoryColors)
    const goalToColor: { [key: string]: string } = {
      // Disorder (red)
      anxiety: '#FF6B6B',
      panic: '#FF6B6B',
      depression: '#FF6B6B',
      adhd: '#FF6B6B',
      // Wellness (green)
      burnout: '#6BCB77',
      'self-compassion': '#6BCB77',
      stress: '#6BCB77',
      // Skill (blue)
      focus: '#5B8DEE',
      addiction: '#5B8DEE',
      mindfulness: '#5B8DEE',
      // Wind down (purple)
      sleep: '#B8A9E8',
    };
    return goalToColor[goal] || '#5B8DEE'; // Default to blue
  };

  const renderVisualSection = () => (
    <View style={styles.visualSection}>
      <View style={styles.meditationVisual}>
        <View style={styles.visualContainer}>
          <Text style={styles.visualIcon}>{getModalityIcon(session.modality)}</Text>
          <TouchableOpacity style={styles.playButton}>
            <Text style={styles.playIcon}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderMeditationInfo = (showTags = true) => {
    // Get unique module objects from module IDs (remove duplicates)
    // Also filter out the goal if it matches a module ID to avoid duplicate tags
    const uniqueModuleIds = Array.from(new Set(sessionModules));
    const moduleObjects: MentalHealthModule[] = uniqueModuleIds
      .map(moduleId => mentalHealthModules.find(m => m.id === moduleId))
      .filter((module): module is MentalHealthModule => module !== undefined)
      .filter(module => module.id !== session.goal);

    const goalColor = getGoalColor(session.goal);
    const modalityColor = getModalityColor(session.modality);

    // Helper to lighten border colors
    const getLightBorderColor = (color: string) => {
      // Add opacity to make border lighter (80 = ~50% opacity)
      return color + '80';
    };

    return (
      <View style={styles.meditationInfo}>
        {showTags && (
          <View style={styles.tagsContainer}>
            <View style={[styles.tag, styles.tagColored, { borderColor: getLightBorderColor(goalColor) }]}>
              <Text style={styles.tagTextColored}>{session.goal}</Text>
            </View>
            {moduleObjects.map((module) => {
              const categoryColor = getCategoryColor(module.category);
              return (
                <View 
                  key={module.id} 
                  style={[styles.tag, styles.tagColored, { borderColor: getLightBorderColor(categoryColor) }]}
                >
                  <Text style={styles.tagTextColored}>{module.title}</Text>
                </View>
              );
            })}
            <View style={[styles.tag, styles.tagColored, { borderColor: getLightBorderColor(modalityColor) }]}>
              <Text style={styles.tagTextColored}>
                {getModalityIcon(session.modality)} {session.modality}
              </Text>
            </View>
            <View style={[styles.tag, styles.tagNeutral]}>
              <Text style={styles.tagTextNeutral}>{session.durationMin} min</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderDescription = () => {
    if (!session || !session.description) {
      return null;
    }
    
    const MAX_LENGTH = 75;
    const isLong = session.description.length > MAX_LENGTH;
    const displayText = isLong && !isDescriptionExpanded 
      ? session.description.substring(0, MAX_LENGTH) + '...'
      : session.description;
    
    return (
      <View style={styles.descriptionSection}>
        <Text style={styles.descriptionTitle}>Description</Text>
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>
            {displayText}
          </Text>
          {isLong && (
            <TouchableOpacity 
              onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              style={styles.readMoreButton}
            >
              <Text style={styles.readMoreText}>
                {isDescriptionExpanded ? 'Read less' : 'Read more'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderBenefitsExplanation = () => {
    if (!session || !session.whyItWorks) {
      return null;
    }

    // Use the whyItWorks text directly as 1-2 sentences
    const whyText = session.whyItWorks.trim();

    if (whyText.length === 0) {
      return null;
    }

    // Get the accent color by finding which module matches the current background color
    let accentColor = getGoalColor(session.goal);
    const matchingModuleId = Object.entries(prerenderedModuleBackgrounds).find(
      ([_, bgColor]) => bgColor === globalBackgroundColor
    )?.[0];

    if (matchingModuleId) {
      const matchingModule = mentalHealthModules.find(m => m.id === matchingModuleId);
      if (matchingModule) {
        accentColor = getCategoryColor(matchingModule.category);
      }
    }

    return (
      <View style={styles.benefitsSection} testID="benefits-section">
        <Text style={styles.whyThisMeditationTitle}>Why This Meditation?</Text>
        <View style={[styles.whyCalloutCard, { borderLeftColor: accentColor, borderRightColor: accentColor }]}>
          <Text style={styles.whyCalloutText}>{whyText}</Text>
        </View>
      </View>
    );
  };

  const renderSummaryPage = () => {
    if (!session) {
      console.log('[MeditationDetailScreen] ⚠️ renderSummaryPage called but session is null!');
      return null;
    }
    console.log('[MeditationDetailScreen] 🎨 renderSummaryPage called, session:', session.title);
    return renderBenefitsExplanation();
  };

  const renderHistoryPage = () => {
    // Sort history based on sort order
    const sortedHistory = [...sessionHistory].sort((a, b) => {
      return historySortOrder === 'latest' 
        ? b.dateObj.getTime() - a.dateObj.getTime()
        : a.dateObj.getTime() - b.dateObj.getTime();
    });
    
    return (
      <ScrollView style={styles.pageContainer} contentContainerStyle={styles.pageContent}>
        <TouchableWithoutFeedback onPress={() => setShowSortOptions(false)}>
          <View style={styles.historySection}>
            {isLoadingHistory ? (
              <View style={styles.historyLoadingState}>
                <ActivityIndicator size="large" color="#8e8e93" />
                <Text style={styles.historyLoadingText}>Loading history...</Text>
              </View>
            ) : sortedHistory.length > 0 ? (
              <>
                {/* Filter Dropdown */}
                <View style={styles.historyFilterContainer}>
                <TouchableOpacity 
                  style={styles.historyFilterButton}
                  onPress={() => setShowSortOptions(!showSortOptions)}
                >
                  <View style={styles.historyFilterTextContainer}>
                    <Text style={styles.historyFilterButtonText}>
                      {historySortOrder === 'latest' ? (
                        <>
                          <Text style={styles.historyFilterBoldText}>Latest</Text>
                          <Text style={styles.historyFilterArrowText}> → </Text>
                          <Text style={styles.historyFilterLightText}>First</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.historyFilterBoldText}>Earliest</Text>
                          <Text style={styles.historyFilterArrowText}> → </Text>
                          <Text style={styles.historyFilterLightText}>First</Text>
                        </>
                      )}
                    </Text>
                  </View>
                  <Text style={styles.historyFilterArrow}>
                    {showSortOptions ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>
                
                {showSortOptions && (
                  <View style={styles.historyFilterDropdown}>
                    <TouchableOpacity 
                      style={styles.historyFilterOption}
                      onPress={() => {
                        setHistorySortOrder('latest');
                        setShowSortOptions(false);
                      }}
                    >
                      <Text style={[
                        styles.historyFilterOptionText,
                        historySortOrder === 'latest' && styles.historyFilterOptionTextActive
                      ]}>
                        <Text style={styles.historyFilterBoldText}>Latest</Text>
                        <Text style={styles.historyFilterArrowText}> → </Text>
                        <Text style={styles.historyFilterLightText}>First</Text>
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.historyFilterOption}
                      onPress={() => {
                        setHistorySortOrder('earliest');
                        setShowSortOptions(false);
                      }}
                    >
                      <Text style={[
                        styles.historyFilterOptionText,
                        historySortOrder === 'earliest' && styles.historyFilterOptionTextActive
                      ]}>
                        <Text style={styles.historyFilterBoldText}>Earliest</Text>
                        <Text style={styles.historyFilterArrowText}> → </Text>
                        <Text style={styles.historyFilterLightText}>First</Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              
              <View style={styles.historyListContainer}>
              {sortedHistory.map((sessionItem, index) => (
                <View key={sessionItem.id} style={styles.historyCard}>
                  <View style={styles.historyCardContent}>
                    <View style={styles.historyItemLeft}>
                      <View style={styles.historyDurationContainer}>
                        <Text style={styles.historyDurationNumber}>{sessionItem.duration}</Text>
                        <Text style={styles.historyDurationUnit}>min</Text>
                      </View>
                      <Text style={styles.historyItemDate}>{sessionItem.date}</Text>
                    </View>
                    <View style={styles.historyItemRight}>
                      <Text style={styles.historyItemTime}>{sessionItem.time}</Text>
                      <View style={styles.historyStatusDot} />
                    </View>
                  </View>
                </View>
              ))}
              </View>
            </>
          ) : (
            <View style={styles.historyEmptyState}>
              <Text style={styles.historyEmptyIcon}>📊</Text>
              <Text style={styles.historyEmptyText}>No sessions completed</Text>
              <Text style={styles.historyEmptySubtext}>Start your first meditation to see your progress here</Text>
            </View>
          )}
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    );
  };

  const renderHowToPage = () => (
    <View style={styles.pageContainer}>
      <View style={styles.howToSection}>
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>1</Text>
            </View>
            <Text style={styles.instructionText}>Find a quiet, comfortable space</Text>
          </View>
          
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>2</Text>
            </View>
            <Text style={styles.instructionText}>Sit or lie down in a relaxed position</Text>
          </View>
          
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>3</Text>
            </View>
            <Text style={styles.instructionText}>Close your eyes and take a few deep breaths</Text>
          </View>
          
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>4</Text>
            </View>
            <Text style={styles.instructionText}>Focus on your breathing and let go of distractions</Text>
          </View>
          
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>5</Text>
            </View>
            <Text style={styles.instructionText}>Follow the guided meditation instructions</Text>
          </View>
          
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>6</Text>
            </View>
            <Text style={styles.instructionText}>When finished, slowly open your eyes</Text>
          </View>
          
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>7</Text>
            </View>
            <Text style={styles.instructionText}>Take a moment to notice how you feel</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* Sticky Header */}
        <View style={styles.stickyHeader}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{session.title}</Text>
            <View style={styles.headerActions}>
              <ShareIcon 
                onPress={handleSharePress}
              />
            </View>
          </View>
          
          {/* Tabs in Header */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'summary' && styles.activeTab]}
              onPress={() => handleTabChange('summary')}
            >
              <Text style={[styles.tabText, activeTab === 'summary' && styles.activeTabText]}>
                Summary
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'history' && styles.activeTab]}
              onPress={() => handleTabChange('history')}
            >
              <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
                History
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'howto' && styles.activeTab]}
              onPress={() => handleTabChange('howto')}
            >
              <Text style={[styles.tabText, activeTab === 'howto' && styles.activeTabText]}>
                How to
              </Text>
            </TouchableOpacity>
            
            {/* Animated Indicator */}
            <Animated.View 
              style={[
                styles.tabIndicator,
                {
                  transform: [{
                    translateX: scrollX.interpolate({
                      inputRange: [0, screenWidth, screenWidth * 2],
                      outputRange: [
                        ((screenWidth - 32) / 3) / 2 - 45, // Center of first tab minus adjusted offset
                        ((screenWidth - 32) / 3) + ((screenWidth - 32) / 3) / 2 - 45, // Center of second tab minus adjusted offset
                        ((screenWidth - 32) / 3) * 2 + ((screenWidth - 32) / 3) / 2 - 45, // Center of third tab minus adjusted offset
                      ],
                      extrapolate: 'clamp',
                    })
                  }]
                }
              ]} 
            />
          </View>
        </View>

        {/* Horizontal ScrollView for pages */}
        <ScrollView
          ref={horizontalScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onScrollEndDrag={handleScrollEnd}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
          style={styles.horizontalScrollView}
          bounces={false}
        >
          {/* Summary Page */}
          <ScrollView 
            style={[styles.page, { width: screenWidth }]} 
            contentContainerStyle={styles.pageContent}
            onScroll={handleVerticalScroll}
            scrollEventThrottle={16}
          >
            {renderVisualSection()}
            {renderMeditationInfo(true)}
            {renderDescription()}
            {renderSummaryPage()}
          </ScrollView>
          
          {/* History Page */}
          <ScrollView 
            style={[styles.page, { width: screenWidth }]} 
            contentContainerStyle={styles.historyPageContent}
            onScroll={handleVerticalScroll}
            scrollEventThrottle={16}
          >
            {renderHistoryPage()}
          </ScrollView>
          
          {/* How To Page */}
          <ScrollView 
            style={[styles.page, { width: screenWidth }]} 
            contentContainerStyle={styles.howToPageContent}
            onScroll={handleVerticalScroll}
            scrollEventThrottle={16}
          >
            {renderVisualSection()}
            {renderMeditationInfo(false)}
            {renderHowToPage()}
          </ScrollView>
        </ScrollView>
      </SafeAreaView>

      {/* Draggable Action Bar */}
      <DraggableActionBar
        ref={draggableActionBarRef}
        primaryAction={{
          title: "Start",
          icon: "▶",
          onPress: handleStartPress,
        }}
        {...(hasTutorial ? {
          secondaryAction: {
            title: "Tutorial",
            icon: <BookOpenIcon size={12} color="#ffffff" />,
            onPress: handleTutorialPress,
          }
        } : {})}
        themeColor={getGoalColor(session.goal)}
        secondaryColor="#007AFF"
        tabTransitionProgress={scrollX}
      />

      {/* Share Preview Bottom Sheet */}
      {session && isShareSheetOpen && (
        <View style={styles.shareOverlay} pointerEvents="box-none">
          <Reanimated.View
            style={[
              styles.shareBackdrop,
              shareBackdropAnimatedStyle,
            ]}
          >
            <TouchableOpacity
              style={styles.shareBackdropTouchable}
              onPress={handleCloseShareSheet}
              activeOpacity={1}
            />
          </Reanimated.View>

          <Reanimated.View
            style={[
              styles.shareSheet,
              { backgroundColor: globalBackgroundColor },
              shareSheetAnimatedStyle,
            ]}
          >
            <View style={styles.shareHandle} />

            <View style={styles.shareContent}>
              {/* Header with icon and title */}
              <View style={styles.shareHeader}>
                <View style={[styles.shareIconContainer, { backgroundColor: getGoalColor(session.goal) + '15' }]}>
                  <Text style={styles.shareIconText}>{getModalityIcon(session.modality)}</Text>
                </View>
                <View style={styles.shareTitleContainer}>
                  <Text style={styles.shareTitle} numberOfLines={2}>{session.title}</Text>
                  <Text style={styles.shareDuration}>{session.durationMin} min</Text>
                </View>
              </View>

              {/* Tags row */}
              <View style={styles.shareTagsRow}>
                <View style={[styles.shareTag, { borderColor: getGoalColor(session.goal) + '40' }]}>
                  <Text style={styles.shareTagText}>{formattedGoal}</Text>
                </View>
                <View style={[styles.shareTag, { borderColor: getModalityColor(session.modality) + '40' }]}>
                  <Text style={styles.shareTagText}>{session.modality}</Text>
                </View>
              </View>

              {/* Description */}
              {session.description && (
                <Text style={styles.shareDescription} numberOfLines={3}>
                  {session.description}
                </Text>
              )}

              {/* Actions */}
              <View style={styles.shareActions}>
                <TouchableOpacity
                  onPress={handleShareSession}
                  style={[styles.sharePrimaryButton, { backgroundColor: getGoalColor(session.goal) }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sharePrimaryButtonText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCloseShareSheet}
                  style={styles.shareSecondaryButton}
                  activeOpacity={0.6}
                >
                  <Text style={styles.shareSecondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Reanimated.View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.health.container.backgroundColor,
  },
  safeArea: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.health.container.backgroundColor,
  },
  errorText: {
    color: theme.colors.text.primary,
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.health.container.backgroundColor,
  },
  stickyHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 100,
    paddingTop: 44, // Status bar height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 24,
    fontWeight: '400',
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '400',
  },
  horizontalScrollView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  pageContent: {
    paddingBottom: 100,
  },
  howToPageContent: {
    paddingBottom: 130, // Extra padding for How-to page
  },
  historyPageContent: {
    paddingBottom: 130, // Extra padding for History page
  },
  pageSpacer: {
    height: 20, // Small spacer to account for sticky header
  },
  visualSection: {
    height: 200,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
  },
  meditationVisual: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  visualContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualIcon: {
    fontSize: 60,
  },
  visualOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  playIcon: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 2,
  },
  meditationInfo: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: 'transparent',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 4,
  },
  tagColored: {
    backgroundColor: '#FAFAFA',
  },
  tagNeutral: {
    backgroundColor: '#FAFAFA',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  tagTextColored: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
    letterSpacing: -0.08,
    color: '#1C1C1E',
  },
  tagTextNeutral: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.08,
  },
  descriptionSection: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 24,
    backgroundColor: 'transparent',
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  descriptionText: {
    fontSize: 17,
    lineHeight: 25,
    color: '#1C1C1E',
    fontWeight: '400',
    letterSpacing: -0.41,
  },
  benefitsSection: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 32,
    backgroundColor: 'transparent',
  },
  whyThisMeditationTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  whyCalloutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderTopColor: '#E5E5EA',
    borderBottomColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  whyCalloutText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#3C3C43',
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  benefitList: {
    gap: 4,
  },
  benefitInstructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  benefitInstructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  benefitInstructionNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  benefitInstructionText: {
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text.primary,
    flex: 1,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  benefitBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginRight: 14,
    marginTop: 6,
  },
  benefitText: {
    fontSize: 17,
    color: '#1C1C1E',
    flex: 1,
    lineHeight: 24,
    letterSpacing: -0.41,
    fontWeight: '400',
  },
  readMoreButton: {
    marginTop: 4,
    paddingVertical: 8,
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '400',
    letterSpacing: -0.41,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    // Active tab styling handled by text color
  },
  tabText: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 120,
    height: 2,
    backgroundColor: '#007AFF',
    borderRadius: 1,
  },
  tabContent: {
    backgroundColor: 'transparent',
    minHeight: 400,
  },
  dataSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  dataCard: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dataIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  dataText: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  dataSubtext: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  recordTypeSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  recordTypeTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  recordTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  recordTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
  },
  recordTypeButtonActive: {
    backgroundColor: '#007AFF',
  },
  recordTypeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  recordTypeButtonTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  historySection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  historyIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  historyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  historySubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  historyEmptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  historyEmptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  historyEmptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  historyEmptySubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  historyLoadingState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  historyLoadingText: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    marginTop: 16,
    fontWeight: '500',
  },
  historyListContainer: {
    gap: 4,
  },
  historyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    ...theme.shadows.small,
  },
  historyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  historyItemLeft: {
    flex: 1,
  },
  historyDurationContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 3,
  },
  historyDurationNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginRight: 4,
  },
  historyDurationUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  historyItemDate: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  historyItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemTime: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    marginRight: 8,
  },
  historyStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  historyFilterContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  historyFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...theme.shadows.small,
  },
  historyFilterTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  historyFilterButtonText: {
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  historyFilterBoldText: {
    fontWeight: '700',
  },
  historyFilterLightText: {
    fontWeight: '400',
  },
  historyFilterArrowText: {
    fontWeight: '500',
  },
  historyFilterArrow: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginLeft: 8,
  },
  historyFilterDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginTop: 0,
    ...theme.shadows.medium,
    zIndex: 1000,
  },
  historyFilterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  historyFilterOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  historyFilterOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  howToSection: {
    paddingHorizontal: 20,
    paddingVertical: 0,
  },
  howToTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  howToCard: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    ...theme.shadows.medium,
  },
  howToText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.primary,
  },
  tipsSection: {
    gap: 12,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    ...theme.shadows.small,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  tipText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    flex: 1,
  },
  startButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  videoContainer: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    ...theme.shadows.medium,
  },
  videoPlaceholder: {
    fontSize: 18,
    color: theme.colors.text.secondary,
  },
  instructionsContainer: {
    gap: 4,
    marginTop: -20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  instructionNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  instructionText: {
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text.primary,
    flex: 1,
  },
  shareOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 2000,
    elevation: 2000,
  },
  shareBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  shareBackdropTouchable: {
    flex: 1,
  },
  shareSheet: {
    backgroundColor: theme.health.container.backgroundColor,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 100,
    paddingHorizontal: 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  shareHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  shareContent: {
    gap: 20,
  },
  shareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  shareIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIconText: {
    fontSize: 28,
  },
  shareTitleContainer: {
    flex: 1,
    gap: 4,
  },
  shareTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: -0.4,
  },
  shareDuration: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '500',
  },
  shareTagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  shareTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: '#FAFAFA',
  },
  shareTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textTransform: 'capitalize',
  },
  shareDescription: {
    fontSize: 16,
    lineHeight: 23,
    color: theme.colors.text.secondary,
    letterSpacing: -0.2,
  },
  shareActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  sharePrimaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharePrimaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  shareSecondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  shareSecondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});