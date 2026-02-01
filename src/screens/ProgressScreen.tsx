import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, TouchableWithoutFeedback } from 'react-native';
import { useStore } from '../store/useStore';
import { theme } from '../styles/theme';
import { mentalHealthModules } from '../data/modules';
import { InteractiveCalendar } from '../components/InteractiveCalendar';
import { TechniqueEffectivenessChart } from '../components/TechniqueEffectivenessChart';
import { InfoBox } from '../components/InfoBox';
import { ShimmerCalendarCard, ShimmerSessionsCard } from '../components/ShimmerSkeleton';
import { getUserCompletedSessions, CompletedSession } from '../services/progressService';
import { useUserId } from '../hooks/useUserId';
import { BarChartIcon } from '../components/icons/BarChartIcon';
import { getLocalDateString, parseLocalDate } from '../utils/dateUtils';



export const ProgressScreen: React.FC = () => {
  const userProgress = useStore(state => state.userProgress);
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  const setCurrentScreen = useStore(state => state.setCurrentScreen);
  const userId = useUserId();
  
  // Get cache from store
  const sessionsCache = useStore(state => state.sessionsCache);
  const calendarCache = useStore(state => state.calendarCache);
  const setSessionsCache = useStore(state => state.setSessionsCache);
  const setCalendarCache = useStore(state => state.setCalendarCache);
  
  // Get store instance for accessing state outside of render
  const getStoreState = useStore.getState;
  
  // State for streak info box
  const [showStreakInfo, setShowStreakInfo] = useState(false);
  const [streakButtonActive, setStreakButtonActive] = useState(false);
  const streakButtonRef = useRef<any>(null);
  
  // State for session stats from cache
  const [totalSessions, setTotalSessions] = useState(sessionsCache.total);
  const [thisWeekSessions, setThisWeekSessions] = useState(sessionsCache.thisWeek);
  const [thisMonthSessions, setThisMonthSessions] = useState(sessionsCache.thisMonth);
  const [completedSessionsForCalendar, setCompletedSessionsForCalendar] = useState<CompletedSession[]>(calendarCache);
  
  // Initialize loading state: false if cache has data, true otherwise
  const [isLoadingSessions, setIsLoadingSessions] = React.useState(sessionsCache.total === 0 && sessionsCache.thisWeek === 0 && sessionsCache.thisMonth === 0);
  const [isLoadingCalendar, setIsLoadingCalendar] = React.useState(calendarCache.length === 0);

  // Set screen context when component mounts
  React.useEffect(() => {
    setCurrentScreen('progress');
  }, [setCurrentScreen]);

  // Update local state when cache changes
  React.useEffect(() => {
    setTotalSessions(sessionsCache.total);
    setThisWeekSessions(sessionsCache.thisWeek);
    setThisMonthSessions(sessionsCache.thisMonth);
  }, [sessionsCache]);

  React.useEffect(() => {
    setCompletedSessionsForCalendar(calendarCache);
  }, [calendarCache]);

  // Fetch session stats and calendar data from database
  // Only fetch on app open (when userId is first set)
  const hasFetchedOnOpen = React.useRef(false);
  React.useEffect(() => {
    const fetchSessionStats = async () => {
      if (!userId) {
        console.log('📊 [ProgressScreen] No user ID, skipping session stats fetch');
        setIsLoadingSessions(false);
        setIsLoadingCalendar(false);
        return;
      }

      // Get current cache state
      const currentSessionsCache = getStoreState().sessionsCache;
      const currentCalendarCache = getStoreState().calendarCache;

      // Only show loading if we don't have cache data
      if (currentSessionsCache.total === 0 && currentSessionsCache.thisWeek === 0 && currentSessionsCache.thisMonth === 0) {
        setIsLoadingSessions(true);
      }
      if (currentCalendarCache.length === 0) {
        setIsLoadingCalendar(true);
      }

      try {
        console.log('📊 [ProgressScreen] Fetching session stats and calendar data from database (app open)...');
        // Fetch all completed sessions (no limit) to get accurate counts
        const allSessions = await getUserCompletedSessions(userId);

        const today = new Date();
        const todayStr = getLocalDateString(today);

        // Calculate this week (last 7 days)
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        const weekAgoStr = getLocalDateString(weekAgo);
        
        // Calculate this month
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        
        const total = allSessions.length;
        const thisWeek = allSessions.filter(session => {
          return session.completed_date >= weekAgoStr && session.completed_date <= todayStr;
        }).length;
        const thisMonth = allSessions.filter(session => {
          const sessionDate = parseLocalDate(session.completed_date);
          return sessionDate.getFullYear() === currentYear && sessionDate.getMonth() === currentMonth;
        }).length;
        
        // Update cache
        setSessionsCache({ total, thisWeek, thisMonth });
        setCalendarCache(allSessions);
        
        console.log('✅ [ProgressScreen] Session stats and calendar data loaded from database', {
          total,
          thisWeek,
          thisMonth,
          calendarEntries: allSessions.length,
        });
      } catch (error) {
        console.error('❌ [ProgressScreen] Error fetching session stats:', error);
      } finally {
        setIsLoadingSessions(false);
        setIsLoadingCalendar(false);
      }
    };

    // Only fetch once on app open (when userId is first set and cache is empty)
    if (userId && !hasFetchedOnOpen.current) {
      const currentSessionsCache = getStoreState().sessionsCache;
      const currentCalendarCache = getStoreState().calendarCache;
      
      // Only fetch if cache is empty (app just opened, cache was cleared)
      if ((currentSessionsCache.total === 0 && currentSessionsCache.thisWeek === 0 && currentSessionsCache.thisMonth === 0) && currentCalendarCache.length === 0) {
        console.log('📊 [ProgressScreen] App opened, fetching session stats and calendar data from database...');
        hasFetchedOnOpen.current = true;
        // Small delay to let cache initialization complete first
        const timer = setTimeout(() => {
          fetchSessionStats();
        }, 100);
        return () => clearTimeout(timer);
      } else {
        // Cache has data, use it
        setIsLoadingSessions(false);
        setIsLoadingCalendar(false);
        hasFetchedOnOpen.current = true;
      }
    }
  }, [userId, setSessionsCache, setCalendarCache]);

  // Handle streak info display
  const handleStreakPress = () => {
    setShowStreakInfo(true);
    setStreakButtonActive(true);
  };

  const handleCloseStreakInfo = () => {
    setShowStreakInfo(false);
    setStreakButtonActive(false);
  };

  // Format date for header
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
      {/* Sticky Header */}
      <View style={[styles.stickyHeader, { backgroundColor: globalBackgroundColor }]}>
        <Text style={styles.title}>Progress</Text>
        
        {/* Streak Display - Top Right */}
        {userProgress.streak > 0 && (
          <View style={styles.streakWrapper}>
            <TouchableOpacity 
              ref={streakButtonRef}
              onPress={handleStreakPress} 
              style={[styles.streakContainer, streakButtonActive && styles.streakContainerActive]}
            >
              <Text style={[styles.headerStreakNumber, streakButtonActive && styles.streakNumberActive]}>{userProgress.streak}</Text>
              <Text style={styles.streakFire}>🔥</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Interactive Calendar */}
        {isLoadingCalendar ? (
          <ShimmerCalendarCard />
        ) : (
          <InteractiveCalendar
            completedSessions={completedSessionsForCalendar}
            onDateSelect={(date) => {
              // Handle date selection - could show meditation details for that date
              const dateStr = getLocalDateString(date);
              const completedMeditations = completedSessionsForCalendar.filter(
                entry => entry.completed_date === dateStr && entry.context_module
              );
              if (completedMeditations.length > 0) {
                // Could show a modal with meditation details
                console.log('Completed meditations on', date.toDateString(), completedMeditations);
              }
            }} 
          />
        )}

        {/* Most Effective Techniques Chart */}
        <TechniqueEffectivenessChart techniques={userProgress.techniqueEffectiveness} />

        {/* Sessions Card */}
        {isLoadingSessions ? (
          <ShimmerSessionsCard />
        ) : (
          <View style={[styles.card, styles.sessionsCard]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderTop}>
                <View style={styles.cardTitleContainer}>
                  <View style={styles.cardTitleIconWrapper}>
                    <BarChartIcon size={26} color="#000000" />
                  </View>
                  <View style={styles.cardTitleTextWrapper}>
                    <Text style={styles.cardTitle}>Sessions</Text>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={styles.sessionsContent}>
              <View style={styles.sessionStat}>
                <Text style={styles.sessionLabel}>Total</Text>
                <Text style={styles.sessionValue}>{totalSessions}</Text>
              </View>
              
              <View style={styles.sessionStat}>
                <Text style={styles.sessionLabel}>This Week</Text>
                <Text style={styles.sessionValue}>{thisWeekSessions}</Text>
              </View>
              
              <View style={styles.sessionStat}>
                <Text style={styles.sessionLabel}>This Month</Text>
                <Text style={styles.sessionValue}>{thisMonthSessions}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
        </ScrollView>

      {/* Streak Info Box */}
      <InfoBox
        isVisible={showStreakInfo}
        onClose={handleCloseStreakInfo}
        title="Streak Information"
        content={`Current Streak: ${userProgress.streak} days`}
        position={{ top: 101, right: 20 }}
      />
    </View>
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
  
  // Streak Display
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  headerStreakNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
    marginRight: 4,
  },
  streakFire: {
    fontSize: 16,
  },
  streakContainerActive: {
    backgroundColor: '#FF8A65',
  },
  streakNumberActive: {
    color: '#FFFFFF',
  },
  
  // Streak Wrapper (for positioning info box)
  streakWrapper: {
    position: 'relative',
  },
  scrollContent: {
    paddingTop: 120, // Account for shorter sticky header height (same as Today page)
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitleIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleTextWrapper: {
    justifyContent: 'center',
    marginLeft: 6,
    paddingTop: 1,
  },
  sessionsContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 8,
  },
  sessionsCard: {
    minHeight: 100, // Constant size to match shimmer skeleton
  },
  sessionStat: {
    flex: 1,
    alignItems: 'center',
    minHeight: 65, // Constant size for consistent layout
  },
  sessionLabel: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
    marginBottom: 4,
  },
  sessionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  bottomSpacing: {
    height: 120,
  },
}); 