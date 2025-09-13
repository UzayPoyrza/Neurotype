import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, TouchableWithoutFeedback } from 'react-native';
import { useStore } from '../store/useStore';
import { theme } from '../styles/theme';
import { mentalHealthModules } from '../data/modules';
import { InteractiveCalendar } from '../components/InteractiveCalendar';



export const ProgressScreen: React.FC = () => {
  const userProgress = useStore(state => state.userProgress);
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  const setCurrentScreen = useStore(state => state.setCurrentScreen);
  
  // State for info box
  const [showInfoBox, setShowInfoBox] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Set screen context when component mounts
  React.useEffect(() => {
    setCurrentScreen('progress');
  }, [setCurrentScreen]);

  // Handle streak info display
  const handleStreakPress = () => {
    if (showInfoBox) {
      // Hide info box
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowInfoBox(false));
    } else {
      // Show info box
      setShowInfoBox(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  // Hide info box when tapping elsewhere
  const hideInfoBox = () => {
    if (showInfoBox) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowInfoBox(false));
    }
  };
  const today = new Date();

  // Calculate stats
  const totalSessions = userProgress.sessionDeltas.length;

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
            onPress={handleStreakPress} 
            style={[styles.streakContainer, showInfoBox && styles.streakContainerActive]}
          >
            <Text style={[styles.headerStreakNumber, showInfoBox && styles.streakNumberActive]}>{userProgress.streak}</Text>
            <Text style={styles.streakFire}>🔥</Text>
          </TouchableOpacity>
            
            {/* Info Box */}
            {showInfoBox && (
              <Animated.View 
                style={[
                  styles.infoBox,
                  {
                    opacity: fadeAnim,
                    transform: [{
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-10, 0],
                      })
                    }]
                  }
                ]}
              >
                <Text style={styles.infoBoxText}>
                  Current Streak: {userProgress.streak} days{'\n'}
                  Best Streak: {userProgress.bestStreak} days
                </Text>
              </Animated.View>
            )}
          </View>
        )}
      </View>
    
      {/* Invisible overlay for tap detection when info box is open */}
      {showInfoBox && (
        <TouchableWithoutFeedback onPress={hideInfoBox}>
          <View style={styles.tapOverlay} />
        </TouchableWithoutFeedback>
      )}
    
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

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

        {/* Interactive Calendar */}
        <InteractiveCalendar onDateSelect={(date) => {
          // Handle date selection - could show meditation details for that date
          const completedMeditation = userProgress.sessionDeltas.find(
            session => session.date === date.toISOString().split('T')[0]
          );
          if (completedMeditation) {
            // Could show a modal with meditation details
            console.log('Completed meditation on', date.toDateString(), completedMeditation);
          }
        }} />

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
  
  // Info Box
  infoBox: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
  },
  infoBoxText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },
  tapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  scrollContent: {
    paddingTop: 120, // Account for shorter sticky header height (same as Today page)
  },
  recordButton: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
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