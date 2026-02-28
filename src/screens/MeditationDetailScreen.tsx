import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  TouchableWithoutFeedback,
  Share,
  ActivityIndicator,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import BottomSheet from '@gorhom/bottom-sheet';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Session } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useStore, prerenderedModuleBackgrounds } from '../store/useStore';
import { BarChartIcon } from '../components/icons/BarChartIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { HeartIcon, HeartOutlineIcon } from '../components/icons/PlayerIcons';
import Svg, { Path } from 'react-native-svg';
import { meditationAudioData } from '../data/meditationMockData';
import { getSessionById, getSessionModules } from '../services/sessionService';
import { ShimmerMeditationDetailMedia, ShimmerMeditationDetailContent, ShimmerSkeleton } from '../components/ShimmerSkeleton';
import { mentalHealthModules, getCategoryColor, MentalHealthModule } from '../data/modules';
import { darkenColor } from '../utils/gradientBackgrounds';
import { useUserId } from '../hooks/useUserId';
import { supabase } from '../services/supabase';

type MeditationDetailStackParamList = {
  MeditationDetail: {
    sessionId: string;
    contextModuleId?: string;
  };
};

type MeditationDetailRouteProp = RouteProp<MeditationDetailStackParamList, 'MeditationDetail'>;
type MeditationDetailNavigationProp = StackNavigationProp<MeditationDetailStackParamList, 'MeditationDetail'>;

interface MeditationDetailScreenProps {}

type TabType = 'summary' | 'history' | 'howto';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const HERO_HEIGHT = 280;
const CARD_OVERLAP = 80;
const TAB_UNDERLINE_WIDTH_FRACTION = 0.6; // underline is 60% of tab width

export const MeditationDetailScreen: React.FC<MeditationDetailScreenProps> = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MeditationDetailNavigationProp>();
  const route = useRoute<MeditationDetailRouteProp>();
  const { sessionId, contextModuleId } = route.params;
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  const setActiveSession = useStore(state => state.setActiveSession);
  const getCachedSession = useStore(state => state.getCachedSession);
  const cacheSessions = useStore(state => state.cacheSessions);
  const likedSessionIds = useStore(state => state.likedSessionIds);
  const toggleLikedSession = useStore(state => state.toggleLikedSession);

  const [session, setSession] = useState<Session | null>(null);
  const isLiked = session ? likedSessionIds.includes(session.id) : false;
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
  const underlineAnim = useRef(new Animated.Value(0)).current;
  const bottomSheetRef = useRef<BottomSheet>(null);
  const contentScrollRef = useRef<ScrollView>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const isCollapsingRef = useRef(false);
  const hasScrolledContentRef = useRef(false);
  const expandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isShareSheetOpen, setShareSheetOpen] = useState(false);
  const shareSheetProgress = useSharedValue(0);

  // Heart popup animation
  const heartPopupScale = useSharedValue(0);
  const heartPopupOpacity = useSharedValue(0);

  const triggerHeartPopup = useCallback(() => {
    heartPopupScale.value = 0;
    heartPopupOpacity.value = 0;

    heartPopupScale.value = withSequence(
      withSpring(1.05, { damping: 14, stiffness: 180, mass: 0.7 }),
      withDelay(600, withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }))
    );
    heartPopupOpacity.value = withSequence(
      withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) }),
      withDelay(650, withTiming(0, { duration: 350, easing: Easing.in(Easing.ease) }))
    );
  }, []);

  const heartPopupStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartPopupScale.value }],
    opacity: heartPopupOpacity.value,
  }));

  const [heartPopupText, setHeartPopupText] = useState('');

  const handleLikePress = useCallback(() => {
    if (!session) return;
    const willLike = !likedSessionIds.includes(session.id);
    setHeartPopupText(willLike ? 'Added to Liked Meditations' : 'Removed from Liked Meditations');
    triggerHeartPopup();
    toggleLikedSession(session.id);
  }, [session, likedSessionIds, triggerHeartPopup, toggleLikedSession]);

  // Bottom sheet snap points: 55% collapsed, 80% expanded
  const snapPoints = useMemo(() => [screenHeight - HERO_HEIGHT + 8, '81%'], []);

  // Underline tab indicator position
  const tabWidth = screenWidth / 3;
  const underlineOffset = tabWidth * 0.5 * (1 - TAB_UNDERLINE_WIDTH_FRACTION);
  const underlineLeft = underlineAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      underlineOffset,
      tabWidth + underlineOffset,
      tabWidth * 2 + underlineOffset,
    ],
    extrapolate: 'clamp',
  });

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

  // Load session from cache or database
  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);

      const cachedSession = getCachedSession(sessionId);
      if (cachedSession) {
        const isComplete = cachedSession.description && cachedSession.whyItWorks;

        if (isComplete) {
          setSession(cachedSession);
          const modules = await getSessionModules(sessionId);
          setSessionModules(modules);
          setIsLoading(false);
          return;
        }
      }

      try {
        const fetchedSession = await getSessionById(sessionId);
        if (fetchedSession) {
          setSession(fetchedSession);
          cacheSessions([fetchedSession]);

          const modules = await getSessionModules(sessionId);
          setSessionModules(modules);
        }
      } catch (error) {
        console.error('[MeditationDetailScreen] Error fetching session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [sessionId, getCachedSession, cacheSessions]);

  // Fetch session history only when user enters history tab
  useEffect(() => {
    const fetchSessionHistory = async () => {
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
        const { data, error } = await supabase
          .from('completed_sessions')
          .select('*')
          .eq('user_id', userId)
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[MeditationDetailScreen] Error fetching session history:', error);
          setSessionHistory([]);
          setHasFetchedHistory(true);
          return;
        }

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
        console.error('[MeditationDetailScreen] Error in fetchSessionHistory:', error);
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
    setActiveTab(tab);
    Animated.timing(underlineAnim, {
      toValue: tabIndex,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const handleTutorialPress = () => {
    if (session) {
      const tutorialSession = { ...session, isTutorial: true };
      setActiveSession(tutorialSession);
    }
  };

  const handleStartPress = () => {
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

  // --- Helper functions ---

  const getModalityIcon = (modality: string) => {
    const icons: { [key: string]: string } = {
      sound: '\u{1F50A}',
      movement: '\u{1F3C3}',
      mantra: '\u{1F549}\uFE0F',
      visualization: '\u{1F441}\uFE0F',
      somatic: '\u{1F932}',
      mindfulness: '\u{1F338}',
      breathing: '\u{1F4A8}',
    };
    return icons[modality.toLowerCase()] || '\u{1F3AF}';
  };

  const getGoalColor = (goal: string) => {
    const goalToColor: { [key: string]: string } = {
      anxiety: '#FF6B6B',
      panic: '#FF6B6B',
      depression: '#FF6B6B',
      adhd: '#FF6B6B',
      burnout: '#6BCB77',
      'self-compassion': '#6BCB77',
      stress: '#6BCB77',
      focus: '#5B8DEE',
      addiction: '#5B8DEE',
      mindfulness: '#5B8DEE',
      sleep: '#B8A9E8',
    };
    return goalToColor[goal] || '#5B8DEE';
  };

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  // ==================== LOADING STATE ====================
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        {/* Shimmer hero */}
        <View style={[styles.heroGradient, { backgroundColor: theme.colors.surfaceElevated }]}>
          <View style={[styles.fixedBackBtn, { top: insets.top + 8 }]}>
            <TouchableOpacity
              style={[styles.floatingBtnInner, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.floatingBtnIcon}>{'\u2039'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.contentCard, { backgroundColor: theme.colors.background }]}>
          <View style={{ padding: 20 }}>
            <ShimmerSkeleton width="80%" height={26} borderRadius={6} />
            <View style={{ height: 16 }} />
            <ShimmerSkeleton width="50%" height={16} borderRadius={6} />
            <View style={{ height: 24 }} />
            <ShimmerMeditationDetailContent />
          </View>
        </View>
      </View>
    );
  }

  // ==================== ERROR STATE ====================
  if (!session) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>Meditation not found</Text>
      </View>
    );
  }

  // ==================== COMPUTED VALUES ====================
  // Determine accent color from the module context the user navigated from
  const contextModule = contextModuleId
    ? mentalHealthModules.find(m => m.id === contextModuleId)
    : null;
  const goalColor = contextModule
    ? getCategoryColor(contextModule.category)
    : getGoalColor(session.goal);

  const uniqueModuleIds = Array.from(new Set(sessionModules));
  const moduleObjects: MentalHealthModule[] = uniqueModuleIds
    .map(moduleId => mentalHealthModules.find(m => m.id === moduleId))
    .filter((module): module is MentalHealthModule => module !== undefined)
    .filter(module => module.id !== session.goal);

  // Accent color for science section
  let scienceAccentColor = getGoalColor(session.goal);
  const matchingModuleId = Object.entries(prerenderedModuleBackgrounds).find(
    ([_, bgColor]) => bgColor === globalBackgroundColor
  )?.[0];
  if (matchingModuleId) {
    const matchingModule = mentalHealthModules.find(m => m.id === matchingModuleId);
    if (matchingModule) {
      scienceAccentColor = getCategoryColor(matchingModule.category);
    }
  }

  // ==================== SUMMARY TAB ====================
  const renderSummaryTab = () => (
    <View style={styles.tabContent}>
      {/* Also helps with */}
      {moduleObjects.length > 0 && (
        <View style={styles.alsoHelpsSection}>
          <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>Also helps with</Text>
          <View style={styles.moduleTagsRow}>
            {moduleObjects.map(mod => (
              <View key={mod.id} style={[styles.moduleTag, { backgroundColor: getCategoryColor(mod.category) + '12', borderColor: getCategoryColor(mod.category) + '30' }]}>
                <View style={[styles.moduleTagDot, { backgroundColor: getCategoryColor(mod.category) }]} />
                <Text style={[styles.moduleTagText, { color: theme.colors.text.primary }]}>{mod.title}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Why it works */}
      {session.whyItWorks && session.whyItWorks.trim().length > 0 ? (
        <View style={[
          styles.scienceCard,
          { backgroundColor: theme.colors.surface, borderLeftColor: scienceAccentColor },
          theme.isDark && { borderWidth: 1, borderColor: theme.colors.border, borderLeftWidth: 3, borderLeftColor: scienceAccentColor },
        ]}>
          <Text style={[styles.scienceLabel, { color: theme.colors.text.secondary }]}>Why it works</Text>
          <Text style={[styles.scienceText, { color: theme.colors.text.primary }]}>
            {session.whyItWorks.trim()}
          </Text>
        </View>
      ) : null}
    </View>
  );

  // ==================== HISTORY TAB ====================
  const renderHistoryTab = () => {
    const sortedHistory = [...sessionHistory].sort((a, b) => {
      return historySortOrder === 'latest'
        ? b.dateObj.getTime() - a.dateObj.getTime()
        : a.dateObj.getTime() - b.dateObj.getTime();
    });

    const cardStyle = {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      marginHorizontal: 16,
      ...(theme.isDark ? { borderWidth: 1, borderColor: theme.colors.border } : {}),
    };

    return (
      <View style={styles.tabContent}>
        <TouchableWithoutFeedback onPress={() => setShowSortOptions(false)}>
          <View>
            {isLoadingHistory ? (
              <View style={styles.historyLoadingState}>
                <ActivityIndicator size="large" color={theme.colors.text.secondary} />
                <Text style={[styles.historyLoadingText, { color: theme.colors.text.secondary }]}>Loading...</Text>
              </View>
            ) : sortedHistory.length > 0 ? (
              <>
                {/* Sort dropdown */}
                <View style={styles.sortContainer}>
                  <TouchableOpacity
                    style={styles.sortButton}
                    onPress={() => setShowSortOptions(!showSortOptions)}
                  >
                    <Text style={[styles.sortButtonText, { color: theme.colors.text.secondary }]}>
                      {historySortOrder === 'latest' ? 'Latest first' : 'Earliest first'} {showSortOptions ? '\u25B4' : '\u25BE'}
                    </Text>
                  </TouchableOpacity>

                  {showSortOptions && (
                    <View style={[styles.sortDropdown, { backgroundColor: theme.colors.surface, ...theme.shadows.medium, ...(theme.isDark ? { borderWidth: 1, borderColor: theme.colors.border } : {}) }]}>
                      <TouchableOpacity
                        style={styles.sortOption}
                        onPress={() => { setHistorySortOrder('latest'); setShowSortOptions(false); }}
                      >
                        <Text style={[
                          styles.sortOptionText,
                          { color: theme.colors.text.primary },
                          historySortOrder === 'latest' && { color: theme.colors.accent, fontWeight: '600' },
                        ]}>Latest first</Text>
                      </TouchableOpacity>
                      <View style={[styles.sortOptionSeparator, { backgroundColor: theme.colors.border }]} />
                      <TouchableOpacity
                        style={styles.sortOption}
                        onPress={() => { setHistorySortOrder('earliest'); setShowSortOptions(false); }}
                      >
                        <Text style={[
                          styles.sortOptionText,
                          { color: theme.colors.text.primary },
                          historySortOrder === 'earliest' && { color: theme.colors.accent, fontWeight: '600' },
                        ]}>Earliest first</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Sessions list */}
                <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary, paddingHorizontal: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 13, fontWeight: '600' }]}>SESSIONS</Text>
                <View style={[cardStyle, { overflow: 'hidden' as const }]}>
                  {sortedHistory.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <View style={styles.historyRow}>
                        <View style={styles.historyRowLeft}>
                          <Text style={[styles.historyDate, { color: theme.colors.text.primary }]}>{item.date}</Text>
                          <Text style={[styles.historyTime, { color: theme.colors.text.secondary }]}>{item.time}</Text>
                        </View>
                        <View style={styles.historyRowRight}>
                          <Text style={[styles.historyDuration, { color: theme.colors.text.primary }]}>{item.duration} min</Text>
                          <View style={[styles.historyGreenDot, { backgroundColor: theme.colors.success }]} />
                        </View>
                      </View>
                      {index < sortedHistory.length - 1 && (
                        <View style={[styles.historyRowSeparator, { backgroundColor: theme.colors.border }]} />
                      )}
                    </React.Fragment>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.historyEmptyState}>
                <BarChartIcon size={48} color={theme.colors.text.secondary} />
                <Text style={[styles.historyEmptyTitle, { color: theme.colors.text.primary }]}>No sessions completed</Text>
                <Text style={[styles.historyEmptySubtitle, { color: theme.colors.text.secondary }]}>
                  Start your first meditation to see your progress here
                </Text>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  };

  // ==================== HOW TO TAB ====================
  const instructions = [
    'Find a quiet, comfortable space',
    'Sit or lie down in a relaxed position',
    'Close your eyes and take a few deep breaths',
    'Focus on your breathing and let go of distractions',
    'Follow the guided meditation instructions',
    'When finished, slowly open your eyes',
    'Take a moment to notice how you feel',
  ];

  const renderHowToTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary, paddingHorizontal: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 13, fontWeight: '600' }]}>PREPARATION</Text>
      <View style={[{
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        marginHorizontal: 16,
        overflow: 'hidden' as const,
        ...(theme.isDark ? { borderWidth: 1, borderColor: theme.colors.border } : {}),
      }]}>
        {instructions.map((instruction, index) => (
          <React.Fragment key={index}>
            <View style={styles.instructionRow}>
              <Text style={[styles.instructionNumber, { color: goalColor }]}>
                {String(index + 1).padStart(2, '0')}
              </Text>
              <Text style={[styles.instructionText, { color: theme.colors.text.primary }]}>{instruction}</Text>
            </View>
            {index < instructions.length - 1 && (
              <View style={[styles.instructionSeparator, { backgroundColor: theme.colors.border }]} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  // ==================== MAIN RENDER ====================
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Fixed back button */}
      <View style={[styles.fixedBackBtn, { top: insets.top + 8 }]}>
        <TouchableOpacity
          style={[styles.floatingBtnInner, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.floatingBtnIcon}>{'\u2039'}</Text>
        </TouchableOpacity>
      </View>

      {/* Fixed share button */}
      <View style={[styles.fixedShareBtn, { top: insets.top + 8 }]}>
        <TouchableOpacity
          style={[styles.floatingBtnInner, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
          onPress={handleSharePress}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="m16 6-4-4-4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M12 2v13" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* ─── 1. Hero Gradient (fixed behind bottom sheet) ── */}
      <LinearGradient
        colors={[goalColor, darkenColor(goalColor, 0.3)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroGradient]}
      >
        {/* Duration badge */}
        <View style={styles.heroDurationBadge}>
          <Text style={styles.heroDurationText}>{session.durationMin} min</Text>
        </View>

        {/* Large centered modality emoji + label */}
        <Text style={styles.heroEmoji}>{getModalityIcon(session.modality)}</Text>
        <Text style={styles.heroModalityLabel}>{capitalize(session.modality)}</Text>
      </LinearGradient>

      {/* ─── 2. Bottom Sheet Card ────────────────────────── */}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={0}
        enablePanDownToClose={false}
        enableDynamicSizing={false}
        enableContentPanningGesture={!sheetExpanded}
        enableHandlePanningGesture={true}
        onAnimate={(_fromIndex, toIndex) => {
          if (toIndex === 1) {
            expandTimeoutRef.current = setTimeout(() => {
              setSheetExpanded(true);
              hasScrolledContentRef.current = false;
            }, 400);
          }
        }}
        onChange={(index) => {
          if (index === 0) {
            if (expandTimeoutRef.current) {
              clearTimeout(expandTimeoutRef.current);
              expandTimeoutRef.current = null;
            }
            setSheetExpanded(false);
            contentScrollRef.current?.scrollTo({ y: 0, animated: false });
          }
          isCollapsingRef.current = false;
        }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.surfaceTertiary, width: 36 }}
        backgroundStyle={[styles.contentCard, { backgroundColor: theme.colors.background }]}
        style={styles.bottomSheetShadow}
      >
        <ScrollView
          ref={contentScrollRef}
          showsVerticalScrollIndicator={false}
          scrollEnabled={sheetExpanded}
          bounces={true}
          scrollEventThrottle={16}
          onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const y = e.nativeEvent.contentOffset.y;
            if (y > 10) {
              hasScrolledContentRef.current = true;
            }
            if (sheetExpanded && hasScrolledContentRef.current && !isCollapsingRef.current && y < -250) {
              isCollapsingRef.current = true;
              bottomSheetRef.current?.snapToIndex(0);
            }
          }}
          contentContainerStyle={{ paddingBottom: 160 }}
          style={{ flex: 1 }}
        >
          {/* Title row with like button */}
          <View style={styles.titleRow}>
            <Text style={[styles.contentTitle, { color: theme.colors.text.primary }]}>{session.title}</Text>
            <TouchableOpacity
              onPress={handleLikePress}
              style={styles.likeButton}
              activeOpacity={0.7}
            >
              {isLiked ? (
                <HeartIcon size={28} color="#ff6b6b" />
              ) : (
                <HeartOutlineIcon size={28} color={theme.colors.text.tertiary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Metadata grid */}
          <View style={styles.metadataGrid}>
            <View style={styles.metaGridItem}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z" fill={theme.colors.text.tertiary} />
              </Svg>
              <Text style={[styles.metaGridText, { color: theme.isDark ? 'rgba(200,200,210,1)' : 'rgba(60,60,67,0.75)' }]}>{capitalize(session.modality)}</Text>
            </View>
            <View style={styles.metaGridItem}>
              <ClockIcon size={14} color={theme.colors.text.tertiary} />
              <Text style={[styles.metaGridText, { color: theme.isDark ? 'rgba(200,200,210,1)' : 'rgba(60,60,67,0.75)' }]}>{session.durationMin} min</Text>
            </View>
            <View style={styles.metaGridItem}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill={theme.colors.text.tertiary} />
              </Svg>
              <Text style={[styles.metaGridText, { color: theme.isDark ? 'rgba(200,200,210,1)' : 'rgba(60,60,67,0.75)' }]}>{formattedGoal}</Text>
            </View>
            <View style={styles.metaGridItem}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" fill={theme.colors.text.tertiary} />
              </Svg>
              <Text style={[styles.metaGridText, { color: theme.isDark ? 'rgba(200,200,210,1)' : 'rgba(60,60,67,0.75)' }]}>{moduleObjects.length > 0 ? `${moduleObjects.length + 1} modules` : '1 module'}</Text>
            </View>
          </View>

          {/* Description */}
          {session.description ? (
            <View style={styles.descriptionSection}>
              <Text style={[styles.descriptionHeader, { color: theme.colors.text.primary }]}>Description</Text>
              <Text style={[styles.descriptionText, { color: theme.isDark ? 'rgba(200,200,210,1)' : 'rgba(60,60,67,0.75)' }]}>
                {session.description.length > 150 && !isDescriptionExpanded
                  ? session.description.substring(0, 150) + '...'
                  : session.description}
              </Text>
              {session.description.length > 150 && (
                <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                  <Text style={[styles.readMoreText, { color: goalColor }]}>
                    {isDescriptionExpanded ? 'Show less' : 'Read More'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {/* ─── 3. Underline Tab Bar ────────────────────────── */}
          <View style={[styles.tabBarContainer, { borderBottomColor: theme.colors.border }]}>
            {(['summary', 'history', 'howto'] as TabType[]).map((tab) => {
              const label = tab === 'howto' ? 'How to' : capitalize(tab);
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={styles.tabBarItem}
                  onPress={() => handleTabChange(tab)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.tabBarText,
                    { color: theme.colors.text.secondary },
                    isActive && { color: goalColor, fontWeight: '700' },
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Sliding underline */}
            <Animated.View
              style={[
                styles.tabUnderline,
                {
                  backgroundColor: goalColor,
                  width: tabWidth * TAB_UNDERLINE_WIDTH_FRACTION,
                  left: underlineLeft,
                },
              ]}
            />
          </View>

          {/* ─── 4. Tab Content ────────────────────────────── */}
          {activeTab === 'summary' && renderSummaryTab()}
          {activeTab === 'history' && renderHistoryTab()}
          {activeTab === 'howto' && renderHowToTab()}

        </ScrollView>
      </BottomSheet>

      {/* ─── 5. Fixed Begin Session CTA (above tab bar) ──── */}
      <View style={[styles.ctaSection, { backgroundColor: theme.colors.background, bottom: 85 }]}>
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: goalColor }]}
          onPress={handleStartPress}
          activeOpacity={0.85}
          testID="start-session"
        >
          <View style={styles.ctaPlayIcon} />
          <Text style={styles.ctaButtonText}>Begin Session</Text>
        </TouchableOpacity>
      </View>

      {/* Heart popup overlay */}
      <Reanimated.View
        style={[styles.heartPopupContainer, heartPopupStyle]}
        pointerEvents="none"
      >
        <View style={[styles.heartPopupPill, { backgroundColor: '#000000' }]}>
          <HeartIcon size={28} color="#ff6b6b" />
          <Text style={[styles.heartPopupText, { color: '#ffffff' }]}>{heartPopupText}</Text>
        </View>
      </Reanimated.View>

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
              { backgroundColor: theme.colors.background },
              shareSheetAnimatedStyle,
            ]}
          >
            <View style={[styles.shareHandle, { backgroundColor: theme.colors.surfaceTertiary }]} />

            <View style={styles.shareContent}>
              {/* Header with icon and title */}
              <View style={styles.shareHeader}>
                <View style={[styles.shareIconContainer, { backgroundColor: goalColor + '15' }]}>
                  <Text style={styles.shareIconText}>{getModalityIcon(session.modality)}</Text>
                </View>
                <View style={styles.shareTitleContainer}>
                  <Text style={[styles.shareTitle, { color: theme.colors.text.primary }]} numberOfLines={2}>{session.title}</Text>
                  <Text style={[styles.shareDuration, { color: theme.colors.text.secondary }]}>{session.durationMin} min</Text>
                </View>
              </View>

              {/* Tags row */}
              <View style={styles.shareTagsRow}>
                <View style={[styles.shareTag, { backgroundColor: theme.colors.surface, borderColor: goalColor + '40' }]}>
                  <Text style={[styles.shareTagText, { color: theme.colors.text.primary }]}>{formattedGoal}</Text>
                </View>
                <View style={[styles.shareTag, { backgroundColor: theme.colors.surface, borderColor: goalColor + '40' }]}>
                  <Text style={[styles.shareTagText, { color: theme.colors.text.primary }]}>{session.modality}</Text>
                </View>
              </View>

              {/* Description */}
              {session.description && (
                <Text style={[styles.shareDescription, { color: theme.colors.text.secondary }]} numberOfLines={3}>
                  {session.description}
                </Text>
              )}

              {/* Actions */}
              <View style={styles.shareActions}>
                <TouchableOpacity
                  onPress={handleShareSession}
                  style={[styles.sharePrimaryButton, { backgroundColor: goalColor }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sharePrimaryButtonText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCloseShareSheet}
                  style={[styles.shareSecondaryButton, { backgroundColor: theme.colors.border }]}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.shareSecondaryButtonText, { color: theme.colors.text.primary }]}>Cancel</Text>
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
  heartPopupContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  heartPopupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  heartPopupText: {
    fontSize: 15,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
  },

  // ── Hero Gradient ──────────────────────────────────────
  heroGradient: {
    height: HERO_HEIGHT,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheetShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  fixedBackBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 100,
  },
  fixedShareBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 100,
  },
  floatingBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBtnIcon: {
    fontSize: 28,
    fontWeight: '300',
    color: '#ffffff',
    marginTop: -2,
  },
  heroDurationBadge: {
    position: 'absolute',
    bottom: 14,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroDurationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  heroEmoji: {
    fontSize: 64,
  },
  heroModalityLabel: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },

  // ── Content Card ───────────────────────────────────────
  contentCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  contentTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
    flex: 1,
  },
  likeButton: {
    padding: 4,
    marginLeft: 4,
  },
  // ── Metadata Grid ───────────────────────────────────────
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginTop: 14,
    rowGap: 12,
  },
  metaGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    gap: 6,
  },
  metaGridText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // ── Description ────────────────────────────────────────
  descriptionSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  descriptionHeader: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
  },
  readMoreText: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 6,
  },

  // ── Underline Tab Bar ──────────────────────────────────
  tabBarContainer: {
    flexDirection: 'row',
    marginTop: 24,
    borderBottomWidth: 1,
    position: 'relative',
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabBarText: {
    fontSize: 15,
    fontWeight: '500',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    height: 3,
    borderRadius: 1.5,
  },

  // ── Tab Content ────────────────────────────────────────
  tabContent: {
    paddingTop: 16,
  },

  // ── Summary Tab ────────────────────────────────────────
  alsoHelpsSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  moduleTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moduleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  moduleTagDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 7,
  },
  moduleTagText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // ── Science Callout ────────────────────────────────────
  scienceCard: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 14,
    borderLeftWidth: 3,
    padding: 16,
  },
  scienceLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  scienceText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },

  // ── Fixed CTA ───────────────────────────────────────────
  ctaSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 50,
  },
  ctaButton: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPlayIcon: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: '#ffffff',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginRight: 10,
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },

  // ── History Tab ────────────────────────────────────────
  historyLoadingState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  historyLoadingText: {
    fontSize: 15,
    marginTop: 16,
    fontWeight: '500',
  },
  sortContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    position: 'relative',
    zIndex: 1000,
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  sortButtonText: {
    fontSize: 15,
    fontWeight: '400',
  },
  sortDropdown: {
    position: 'absolute',
    top: 36,
    right: 16,
    borderRadius: 10,
    minWidth: 160,
    zIndex: 1001,
    overflow: 'hidden',
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sortOptionText: {
    fontSize: 15,
    fontWeight: '400',
  },
  sortOptionSeparator: {
    height: StyleSheet.hairlineWidth,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  historyRowLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 15,
    fontWeight: '500',
  },
  historyTime: {
    fontSize: 13,
    marginTop: 2,
  },
  historyRowRight: {
    alignItems: 'flex-end',
  },
  historyDuration: {
    fontSize: 15,
    fontWeight: '600',
  },
  historyGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  historyRowSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  historyEmptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  historyEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  historyEmptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },

  // ── How To Tab ─────────────────────────────────────────
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  instructionNumber: {
    fontSize: 20,
    fontWeight: '700',
    width: 36,
    fontVariant: ['tabular-nums'],
  },
  instructionText: {
    marginLeft: 8,
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  instructionSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 60,
  },

  // ── Share Sheet ────────────────────────────────────────
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
    letterSpacing: -0.4,
  },
  shareDuration: {
    fontSize: 15,
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
  },
  shareTagText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  shareDescription: {
    fontSize: 16,
    lineHeight: 23,
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
  },
  shareSecondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
