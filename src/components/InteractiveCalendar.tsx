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
import { mentalHealthModules, getCategoryColor, categoryColors } from '../data/modules';
import { CompletedSession } from '../services/progressService';

const { width } = Dimensions.get('window');

interface InteractiveCalendarProps {
  completedSessions?: CompletedSession[];
  onDateSelect?: (date: Date) => void;
}

export const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({
  completedSessions = [],
  onDateSelect,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Animation refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const headerSlideAnim = useRef(new Animated.Value(0)).current;
  const leftButtonScale = useRef(new Animated.Value(1)).current;
  const rightButtonScale = useRef(new Animated.Value(1)).current;

  // Helper function to get category from moduleId
  const getCategoryFromModuleId = (moduleId: string | undefined): 'disorder' | 'wellness' | 'skill' | 'other' => {
    if (!moduleId) return 'other';
    const module = mentalHealthModules.find(m => m.id === moduleId);
    return module?.category || 'other';
  };

  // Helper function to get category color
  const getCategoryColorForCalendar = (category: 'disorder' | 'wellness' | 'skill' | 'other'): string => {
    if (category === 'other') return theme.colors.primary;
    return getCategoryColor(category);
  };

  // Get all unique categories for completed meditations on a specific date
  const getCompletedCategoriesForDate = (date: Date): Array<'disorder' | 'wellness' | 'skill' | 'other'> => {
    const dateStr = date.toISOString().split('T')[0];
    // Get all entries for this date
    const entriesForDate = completedSessions.filter(entry => entry.completed_date === dateStr);
    
    // Extract unique categories
    const uniqueCategories = Array.from(
      new Set(
        entriesForDate.map(entry => getCategoryFromModuleId(entry.context_module))
      )
    ) as Array<'disorder' | 'wellness' | 'skill' | 'other'>;
    
    return uniqueCategories;
  };

  // Check if there are any meditations in the current month
  const hasMeditationsInCurrentMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return completedSessions.some(entry => {
      const sessionDate = new Date(entry.completed_date);
      return sessionDate.getFullYear() === year && sessionDate.getMonth() === month;
    });
  };

  // Get category display name
  const getCategoryDisplayName = (category: 'disorder' | 'wellness' | 'skill' | 'other'): string => {
    const categoryNames = {
      disorder: 'Disorder',
      wellness: 'Wellness',
      skill: 'Skill',
      other: 'Other',
    };
    return categoryNames[category];
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
            
            const completedCategories = getCompletedCategoriesForDate(date);
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
                
                {completedCategories.length > 0 && (
                  <View style={styles.dotsContainer}>
                    {completedCategories.map((category, dotIndex) => (
                      <View
                        key={`${category}-${dotIndex}`}
                        style={[
                          styles.meditationDot,
                          dotIndex > 0 && styles.meditationDotSpacing,
                          { 
                            backgroundColor: getCategoryColorForCalendar(category),
                          }
                        ]}
                      />
                    ))}
                  </View>
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
    // Get unique categories from completed meditations in the CURRENT MONTH only
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const completedCategories = completedSessions
      .filter(entry => {
        const sessionDate = new Date(entry.completed_date);
        return sessionDate.getFullYear() === year && sessionDate.getMonth() === month;
      })
      .map(entry => getCategoryFromModuleId(entry.context_module))
      .filter((value, index, self) => self.indexOf(value) === index) as Array<'disorder' | 'wellness' | 'skill' | 'other'>;
    
    if (completedCategories.length === 0) {
      return null;
    }
    
    return (
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Meditations Completed:</Text>
        <View style={styles.legendItems}>
          {completedCategories.map((category) => (
            <View key={category} style={styles.legendItem}>
              <View 
                style={[
                  styles.legendDot,
                  { backgroundColor: getCategoryColorForCalendar(category) }
                ]}
              />
              <Text style={styles.legendText}>
                {getCategoryDisplayName(category)}
              </Text>
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
        
        {/* Share Button - reserve space even when hidden */}
        <View style={styles.shareButtonContainer}>
          {hasMeditationsInCurrentMonth() && (
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={handleShareProgress}
            >
              <Text style={styles.shareIcon}>↗</Text>
              <Text style={styles.shareText}>Share My Progress</Text>
            </TouchableOpacity>
          )}
        </View>
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    height: 556, // Fixed height: header (56px) + calendar (300px) + legend (76px) + share button (80px) + padding (32px) + extra space (12px)
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
    height: 456, // Fixed height: calendar (300px) or no meditations (320px) + legend (76px) + share button (80px)
  },
  calendarContainer: {
    marginBottom: 12,
    height: 300, // Increased height: day headers (32px) + 6 rows (260px) + margins (8px) to fit bottom buttons
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
  dotsContainer: {
    position: 'absolute',
    bottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  meditationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  meditationDotSpacing: {
    marginLeft: 4, // Spacing between multiple dots
  },
  legendContainer: {
    marginBottom: 12, // Reduced margin to give more space for share button
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    minHeight: 60, // Fixed minimum height to prevent size changes
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
  shareButtonContainer: {
    height: 80, // Increased height to fully accommodate button with padding and shadow
    justifyContent: 'center',
    marginTop: -4, // Negative margin to move button up
    paddingBottom: 8, // Extra padding at bottom to prevent clipping
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
    height: 360, // Increased height for better vertical centering
    minHeight: 360, // Ensure consistent height
    justifyContent: 'flex-start',
    paddingTop: 40, // Move content lower
  },
  noMeditationsBox: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
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