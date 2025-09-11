import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useStore } from '../store/useStore';
import { theme } from '../styles/theme';
import { mentalHealthModules } from '../data/modules';

// Helper function to get module color by ID
const getModuleColor = (moduleId: string): string => {
  const module = mentalHealthModules.find(m => m.id === moduleId);
  return module?.color || theme.colors.primary;
};

// Helper function to get current date info
const getCurrentDateInfo = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Get week dates (Monday to Sunday)
  const startOfWeek = new Date(today);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  startOfWeek.setDate(diff);
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    weekDates.push(date);
  }
  
  return { today, weekDates };
};

// Calendar component for meditation tracking
const MeditationCalendar: React.FC = () => {
  const userProgress = useStore(state => state.userProgress);
  const { today, weekDates } = getCurrentDateInfo();
  
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Mock data for completed sessions with module info
  // In a real app, this would come from your store
  const getSessionForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    // Mock: assume some sessions were completed with different modules
    const mockSessions: { [key: string]: string } = {
      [new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0]]: 'anxiety', // 2 days ago
      [new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0]]: 'mindfulness', // yesterday
      [today.toISOString().split('T')[0]]: 'stress', // today
    };
    return mockSessions[dateStr];
  };
  
  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        {dayNames.map((day, index) => (
          <View key={day} style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>{day}</Text>
            <Text style={styles.dayNumber}>{weekDates[index].getDate()}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.calendarBody}>
        {weekDates.map((date, index) => {
          const completedModule = getSessionForDate(date);
          const isToday = date.toDateString() === today.toDateString();
          
          return (
            <View key={index} style={[styles.dayCell, isToday && styles.todayCell]}>
              {completedModule && (
                <View 
                  style={[
                    styles.checkMark,
                    { backgroundColor: getModuleColor(completedModule) }
                  ]}
                >
                  <Text style={styles.checkMarkText}>✓</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

export const ProgressScreen: React.FC = () => {
  const userProgress = useStore(state => state.userProgress);
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  const { today } = getCurrentDateInfo();

  // Calculate stats
  const totalSessions = userProgress.sessionDeltas.length;
  const currentStreak = userProgress.streak;

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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.dateText}>{formatDate(today)}</Text>
        </View>

        {/* Streak Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🔥 Streak</Text>
            <Text style={styles.recordButton}>Record ✏️</Text>
          </View>
          
          <View style={styles.streakContent}>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakUnit}>days</Text>
            <Text style={styles.streakSubtext}>Keep it going!</Text>
          </View>
        </View>

        {/* Sessions Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📊 Sessions</Text>
          </View>
          
          <View style={styles.sessionsContent}>
            <View style={styles.sessionStat}>
              <Text style={styles.sessionLabel}>Total</Text>
              <Text style={styles.sessionValue}>{totalSessions}</Text>
            </View>
            
            <View style={styles.sessionStat}>
              <Text style={styles.sessionLabel}>This Week</Text>
              <Text style={styles.sessionValue}>{Math.min(totalSessions, 7)}</Text>
            </View>
            
            <View style={styles.sessionStat}>
              <Text style={styles.sessionLabel}>This Month</Text>
              <Text style={styles.sessionValue}>{Math.min(totalSessions, 30)}</Text>
            </View>
          </View>
        </View>

        {/* Calendar Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📅 This Week</Text>
          </View>
          
          <MeditationCalendar />
        </View>

        {/* Feel Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>😊 Feel</Text>
            <Text style={styles.recordButton}>Record ✏️</Text>
          </View>
          
          <View style={styles.feelContent}>
            <Text style={styles.feelPrompt}>How do you feel now?</Text>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  ...theme.health, // Use global Apple Health styles
  recordButton: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
  },
  streakContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: 52,
  },
  streakUnit: {
    fontSize: 17,
    color: '#8e8e93',
    fontWeight: '400',
    marginTop: -4,
  },
  streakSubtext: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
    marginTop: 8,
  },
  sessionsContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
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
  calendarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '400',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  calendarBody: {
    flexDirection: 'row',
    height: 40,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCell: {
    backgroundColor: '#f2f2f7',
    borderRadius: 8,
  },
  checkMark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMarkText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  feelContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  feelPrompt: {
    fontSize: 17,
    color: '#8e8e93',
    fontWeight: '400',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 120,
  },
}); 