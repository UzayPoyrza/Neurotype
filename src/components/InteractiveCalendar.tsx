import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { theme } from '../styles/theme';
import { useStore } from '../store/useStore';
import { mentalHealthModules } from '../data/modules';

const { width } = Dimensions.get('window');

interface InteractiveCalendarProps {
  onDateSelect?: (date: Date) => void;
}

export const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({
  onDateSelect,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const userProgress = useStore(state => state.userProgress);
  
  // Animation refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const headerSlideAnim = useRef(new Animated.Value(0)).current;
  const leftButtonScale = useRef(new Animated.Value(1)).current;
  const rightButtonScale = useRef(new Animated.Value(1)).current;

  // Helper function to get module color by ID
  const getModuleColor = (moduleId: string): string => {
    const module = mentalHealthModules.find(m => m.id === moduleId);
    return module?.color || theme.colors.primary;
  };

  // Get completed meditation for a specific date
  const getCompletedMeditation = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return userProgress.sessionDeltas.find(session => session.date === dateStr);
  };

  // Check if there are any meditations in the current month
  const hasMeditationsInCurrentMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return userProgress.sessionDeltas.some(session => {
      const sessionDate = new Date(session.date);
      return sessionDate.getFullYear() === year && sessionDate.getMonth() === month;
    });
  };

  // Get module name by ID
  const getModuleName = (moduleId: string): string => {
    const module = mentalHealthModules.find(m => m.id === moduleId);
    return module?.title || moduleId;
  };

  // Get all dates for current month
  const getMonthDates = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const dates: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      dates.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(new Date(year, month, day));
    }
    
    // Fill remaining cells to complete the grid (6 rows = 42 cells)
    const remainingCells = 42 - dates.length;
    for (let i = 0; i < remainingCells; i++) {
      dates.push(null);
    }
    
    return dates;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const slideDirection = direction === 'next' ? 1 : -1;
    const buttonScale = direction === 'next' ? rightButtonScale : leftButtonScale;
    
    // Button press animation - ultra subtle
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.99,
        duration: 40,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 40,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    
    // Start fade out animation - smooth and clean
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      // Update the date when fade out is complete
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
      setCurrentDate(newDate);
      
      // Start fade in animation - smooth and clean
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  // Check if we're at the current month (no future navigation allowed)
  const isCurrentMonth = () => {
    const today = new Date();
    return currentDate.getFullYear() === today.getFullYear() && 
           currentDate.getMonth() === today.getMonth();
  };

  const handleDatePress = (date: Date) => {
    onDateSelect?.(date);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatHeaderDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      year: 'numeric',
    };
    return currentDate.toLocaleDateString('en-US', options);
  };

  const handleShareProgress = () => {
    // TODO: Implement share functionality
    console.log('Share progress');
  };

  const renderCalendar = () => {
    const dates = getMonthDates();
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    
    return (
      <View style={styles.calendarContainer}>
        {/* Day headers */}
        <View style={styles.dayHeaders}>
          {dayNames.map((day) => (
            <Text key={day} style={styles.dayHeaderText}>
              {day}
            </Text>
          ))}
        </View>
        
        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {dates.map((date, index) => {
            if (!date) {
              return <View key={`empty-${index}`} style={styles.emptyCell} />;
            }
            
            const completedMeditation = getCompletedMeditation(date);
            const isTodayDate = isToday(date);
            
            return (
              <TouchableOpacity
                key={date.toISOString()}
                style={[
                  styles.dateCell,
                  isTodayDate && styles.todayCell,
                ]}
                onPress={() => handleDatePress(date)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dateText,
                  isTodayDate && styles.todayText
                ]}>
                  {date.getDate()}
                </Text>
                
                {completedMeditation && completedMeditation.moduleId && (
                  <View 
                    style={[
                      styles.meditationDot,
                      { backgroundColor: getModuleColor(completedMeditation.moduleId) }
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderNoMeditationsMessage = () => {
    return (
      <View style={styles.noMeditationsContainer}>
        <View style={styles.noMeditationsBox}>
          <Text style={styles.noMeditationsIcon}>🧘‍♀️</Text>
          <Text style={styles.noMeditationsTitle}>No Meditations This Month</Text>
          <Text style={styles.noMeditationsText}>
            Start your mindfulness journey by completing your first meditation session.
          </Text>
        </View>
      </View>
    );
  };

  const renderMeditationLegend = () => {
    // Get unique modules from completed meditations in the CURRENT MONTH only
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const completedModules = userProgress.sessionDeltas
      .filter(session => {
        if (!session.moduleId) return false;
        const sessionDate = new Date(session.date);
        return sessionDate.getFullYear() === year && sessionDate.getMonth() === month;
      })
      .map(session => session.moduleId!)
      .filter((value, index, self) => self.indexOf(value) === index);
    
    if (completedModules.length === 0) {
      return null;
    }
    
    return (
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Meditations Completed:</Text>
        <View style={styles.legendItems}>
          {completedModules.map((moduleId) => (
            <View key={moduleId} style={styles.legendItem}>
              <View 
                style={[
                  styles.legendDot,
                  { backgroundColor: getModuleColor(moduleId) }
                ]}
              />
              <Text style={styles.legendText}>{getModuleName(moduleId)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with navigation */}
      <View style={styles.header}>
        <Animated.View style={{ transform: [{ scale: leftButtonScale }] }}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigateMonth('prev')}
          >
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
        </Animated.View>
        
        <Text style={styles.headerTitle}>
          {formatHeaderDate()}
        </Text>
        
        <Animated.View style={{ transform: [{ scale: rightButtonScale }] }}>
          <TouchableOpacity 
            style={[styles.navButton, isCurrentMonth() && styles.navButtonDisabled]}
            onPress={() => !isCurrentMonth() && navigateMonth('next')}
            disabled={isCurrentMonth()}
          >
            <Text style={[styles.navButtonText, isCurrentMonth() && styles.navButtonTextDisabled]}>›</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Calendar Content with Animation */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        {/* Calendar or No Meditations Message */}
        {hasMeditationsInCurrentMonth() ? renderCalendar() : renderNoMeditationsMessage()}
        
        {/* Meditation Legend */}
        {renderMeditationLegend()}
        
        {/* Share Button - only show if there are meditations in current month */}
        {hasMeditationsInCurrentMonth() && (
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={handleShareProgress}
          >
            <Text style={styles.shareIcon}>↗</Text>
            <Text style={styles.shareText}>Share My Progress</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  navButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  navButtonTextDisabled: {
    color: '#cccccc',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  contentContainer: {
    overflow: 'hidden',
    width: '100%',
    flex: 1,
  },
  calendarContainer: {
    marginBottom: 12,
    height: 280, // Fixed height: day headers (32px) + 6 rows (240px) + margins (8px)
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dateCell: {
    width: '14.28%', // 1/7 of the width
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  emptyCell: {
    width: '14.28%', // 1/7 of the width
    height: 40,
    marginBottom: 4,
  },
  todayCell: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  todayText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  meditationDot: {
    position: 'absolute',
    bottom: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  legendContainer: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#666666',
    textTransform: 'capitalize',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  shareIcon: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  shareText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  noMeditationsContainer: {
    marginBottom: 12,
    height: 280, // Match the full calendar height including day headers
  },
  noMeditationsBox: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  noMeditationsIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  noMeditationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  noMeditationsText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});