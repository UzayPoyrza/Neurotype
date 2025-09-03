import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Session } from '../types';
import { theme } from '../styles/theme';

interface SessionProgressViewProps {
  session: Session;
  onFinish: () => void;
  onCancel: () => void;
}

export const SessionProgressView: React.FC<SessionProgressViewProps> = ({
  session,
  onFinish,
  onCancel,
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalDuration = session.durationMin * 60; // Convert to seconds

  useEffect(() => {
    // Start pulse animation for the timer
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    
    if (isActive) {
      pulse();
    }
  }, [isActive, pulseAnim]);

  const startSession = () => {
    setIsActive(true);
    intervalRef.current = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;
        
        // Update progress animation
        Animated.timing(progressAnim, {
          toValue: newTime / totalDuration,
          duration: 100,
          useNativeDriver: false,
        }).start();
        
        // Auto-finish when time is up
        if (newTime >= totalDuration) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setIsActive(false);
          setTimeout(onFinish, 500);
        }
        
        return newTime;
      });
    }, 1000);
  };

  const pauseSession = () => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resumeSession = () => {
    setIsActive(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (timeElapsed / totalDuration) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.sessionTitle}>{session.title}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        {/* Progress Circle */}
        <Animated.View
          style={[
            styles.progressCircle,
            {
              transform: [
                {
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.02],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          
          <View style={styles.timeContainer}>
            <Text style={styles.timeElapsed}>{formatTime(timeElapsed)}</Text>
            <Text style={styles.totalTime}>/ {formatTime(totalDuration)}</Text>
          </View>
        </Animated.View>

        {/* Progress Percentage */}
        <Text style={styles.progressText}>
          {Math.round(progressPercentage)}% Complete
        </Text>
      </View>

      <View style={styles.controls}>
        {!isActive && timeElapsed === 0 && (
          <TouchableOpacity style={styles.startButton} onPress={startSession}>
            <Text style={styles.startButtonText}>Begin Session</Text>
          </TouchableOpacity>
        )}
        
        {!isActive && timeElapsed > 0 && timeElapsed < totalDuration && (
          <TouchableOpacity style={styles.resumeButton} onPress={resumeSession}>
            <Text style={styles.resumeButtonText}>Resume</Text>
          </TouchableOpacity>
        )}
        
        {isActive && (
          <TouchableOpacity style={styles.pauseButton} onPress={pauseSession}>
            <Text style={styles.pauseButtonText}>Pause</Text>
          </TouchableOpacity>
        )}

        {timeElapsed > 0 && (
          <TouchableOpacity style={styles.finishButton} onPress={onFinish}>
            <Text style={styles.finishButtonText}>Finish Early</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    flex: 1,
    fontFamily: theme.typography.fontFamily,
  },
  placeholder: {
    width: 60,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  progressCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.background,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  progressTrack: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 8,
    backgroundColor: theme.colors.disabled,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: 4,
  },
  timeContainer: {
    alignItems: 'center',
  },
  timeElapsed: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
  },
  totalTime: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 4,
    fontFamily: theme.typography.fontFamily,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily,
  },
  controls: {
    paddingHorizontal: 20,
    gap: 12,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.onPrimary,
    fontFamily: theme.typography.fontFamily,
  },
  pauseButton: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.secondary,
    alignItems: 'center',
  },
  pauseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.onPrimary,
    fontFamily: theme.typography.fontFamily,
  },
  resumeButton: {
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.success,
    alignItems: 'center',
  },
  resumeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.onPrimary,
    fontFamily: theme.typography.fontFamily,
  },
  finishButton: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily,
  },
});