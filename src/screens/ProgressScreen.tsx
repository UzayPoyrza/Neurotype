import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, TouchableWithoutFeedback } from 'react-native';
import { useStore } from '../store/useStore';
import { theme } from '../styles/theme';
import { mentalHealthModules } from '../data/modules';
import { InteractiveCalendar } from '../components/InteractiveCalendar';
import { TechniqueEffectivenessChart } from '../components/TechniqueEffectivenessChart';
import { InfoBox } from '../components/InfoBox';
import { getUserCompletedSessions } from '../services/progressService';
import { useUserId } from '../hooks/useUserId';
import { CompletedSessionCacheEntry } from '../store/useStore';



export const ProgressScreen: React.FC = () => {
  const userProgress = useStore(state => state.userProgress);
  const completedSessionsCache = useStore(state => state.completedSessionsCache);
  const addCompletedSessionToCache = useStore(state => state.addCompletedSessionToCache);
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  const setCurrentScreen = useStore(state => state.setCurrentScreen);
  const userId = useUserId();
  
  // State for streak info box
  const [showStreakInfo, setShowStreakInfo] = useState(false);
  const [streakButtonActive, setStreakButtonActive] = useState(false);
  const streakButtonRef = useRef<any>(null);
  
  // State for session stats from database
  const [totalSessions, setTotalSessions] = useState(0);
  const [thisWeekSessions, setThisWeekSessions] = useState(0);
  const [thisMonthSessions, setThisMonthSessions] = useState(0);

  // Set screen context when component mounts
  React.useEffect(() => {
    setCurrentScreen('progress');
  }, [setCurrentScreen]);

  // Populate cache from database only once on mount or when userId changes
  // Don't refetch when navigating to the screen - rely on cache that's already populated
  React.useEffect(() => {
    const populateCacheFromDatabase = async () => {
      if (!userId) {
        console.log('📊 [ProgressScreen] No user ID, skipping cache population');
        return;
      }

      // If cache already has entries, don't fetch - cache is already populated
      // This prevents clearing the cache when navigating to the screen
      if (completedSessionsCache.length > 0) {
        console.log('📊 [ProgressScreen] Cache already has', completedSessionsCache.length, 'entries, skipping fetch');
        return;
      }

      console.log('📊 [ProgressScreen] Cache is empty, populating from database...');
      try {
        // Fetch completed sessions from database (get more entries for calendar)
        const completedSessions = await getUserCompletedSessions(userId, 100);
        console.log('📊 [ProgressScreen] Fetched', completedSessions.length, 'completed sessions from database');

        // Convert database entries to cache format and add to cache
        // Since cache is empty, we can add all entries
        let addedCount = 0;
        for (const session of completedSessions) {
          const cacheEntry: CompletedSessionCacheEntry = {
            id: session.id || `db-${session.session_id}-${session.completed_date}`,
            sessionId: session.session_id,
            moduleId: session.context_module || undefined,
            date: session.completed_date,
            minutesCompleted: session.minutes_completed,
            createdAt: session.created_at || session.completed_date,
          };
          addCompletedSessionToCache(cacheEntry);
          addedCount++;
        }

        if (addedCount > 0) {
          console.log('✅ [ProgressScreen] Added', addedCount, 'entries to cache from database');
        }
      } catch (error) {
        console.error('❌ [ProgressScreen] Error populating cache from database:', error);
      }
    };

    populateCacheFromDatabase();
  }, [userId]); // Only run when userId changes - cache persists across navigation

  // Fetch session stats from database
  React.useEffect(() => {
    const fetchSessionStats = async () => {
      if (!userId) return;

      try {
        // Fetch all completed sessions (no limit) to get accurate counts
        const allSessions = await getUserCompletedSessions(userId);
        
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Calculate this week (last 7 days)
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        
        // Calculate this month
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        
        const total = allSessions.length;
        const thisWeek = allSessions.filter(session => {
          return session.completed_date >= weekAgoStr && session.completed_date <= todayStr;
        }).length;
        const thisMonth = allSessions.filter(session => {
          const sessionDate = new Date(session.completed_date);
          return sessionDate.getFullYear() === currentYear && sessionDate.getMonth() === currentMonth;
        }).length;
        
        setTotalSessions(total);
        setThisWeekSessions(thisWeek);
        setThisMonthSessions(thisMonth);
      } catch (error) {
        console.error('❌ [ProgressScreen] Error fetching session stats:', error);
      }
    };

    fetchSessionStats();
  }, [userId]);

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
        <InteractiveCalendar onDateSelect={(date) => {
          // Handle date selection - could show meditation details for that date
          const dateStr = date.toISOString().split('T')[0];
          const completedMeditations = completedSessionsCache.filter(
            entry => entry.date === dateStr && entry.moduleId
          );
          if (completedMeditations.length > 0) {
            // Could show a modal with meditation details
            console.log('Completed meditations on', date.toDateString(), completedMeditations);
          }
        }} />

        {/* Most Effective Techniques Chart */}
        <TechniqueEffectivenessChart techniques={userProgress.techniqueEffectiveness} />

        {/* Sessions Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderTop}>
              <Text style={styles.cardTitle}>📊 Sessions</Text>
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

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
        </ScrollView>

      {/* Streak Info Box */}
      <InfoBox
        isVisible={showStreakInfo}
        onClose={handleCloseStreakInfo}
        title="Streak Information"
        content={`Current Streak: ${userProgress.streak} days\nBest Streak: ${userProgress.bestStreak} days`}
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
  sessionsContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 20,
  },
  sessionStat: {
    flex: 1,
    alignItems: 'center',
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