import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
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

  // Get module name by ID
  const getModuleName = (moduleId: string): string => {
    const module = mentalHealthModules.find(m => m.id === moduleId);
    return module?.name || moduleId;
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
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
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

  const renderMeditationLegend = () => {
    // Get unique modules from completed meditations
    const completedModules = userProgress.sessionDeltas
      .filter(session => session.moduleId)
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
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {formatHeaderDate()}
        </Text>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      {renderCalendar()}
      
      {/* Meditation Legend */}
      {renderMeditationLegend()}
      
      {/* Share Button */}
      <TouchableOpacity 
        style={styles.shareButton}
        onPress={handleShareProgress}
      >
        <Text style={styles.shareIcon}>↗</Text>
        <Text style={styles.shareText}>Share My Progress</Text>
      </TouchableOpacity>
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  calendarContainer: {
    marginBottom: 20,
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
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
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
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  shareIcon: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 8,
  },
  shareText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});