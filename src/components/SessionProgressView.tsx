import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Session } from '../types';
import { useTheme } from '../contexts/ThemeContext';

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
  const theme = useTheme();
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
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={[styles.cancelText, { color: theme.colors.text.secondary, fontFamily: theme.typography.fontFamily }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <Text style={[styles.sessionTitle, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamily }]}>
          {session.title}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        {/* Progress Circle */}
        <Animated.View
          style={[
            styles.progressCircle,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
              shadowOpacity: theme.isDark ? 0.3 : 0.06,
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
          <View style={[styles.progressTrack, { backgroundColor: theme.colors.disabled }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.colors.success,
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          <View style={styles.timeContainer}>
            <Text style={[styles.timeElapsed, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamily }]}>
              {formatTime(timeElapsed)}
            </Text>
            <Text style={[styles.totalTime, { color: theme.colors.text.secondary, fontFamily: theme.typography.fontFamily }]}>
              / {formatTime(totalDuration)}
            </Text>
          </View>
        </Animated.View>

        {/* Progress Percentage */}
        <Text style={[styles.progressText, { color: theme.colors.text.secondary, fontFamily: theme.typography.fontFamily }]}>
          {Math.round(progressPercentage)}% Complete
        </Text>
      </View>

      <View style={styles.controls}>
        {!isActive && timeElapsed === 0 && (
          <TouchableOpacity
            style={[
              styles.startButton,
              {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.primary,
                borderRadius: theme.borderRadius.lg,
                shadowColor: theme.colors.shadow,
                shadowOpacity: theme.isDark ? 0.3 : 0.06,
              },
            ]}
            onPress={startSession}
          >
            <Text style={[styles.startButtonText, { color: theme.colors.text.onPrimary, fontFamily: theme.typography.fontFamily }]}>
              Begin Session
            </Text>
          </TouchableOpacity>
        )}

        {!isActive && timeElapsed > 0 && timeElapsed < totalDuration && (
          <TouchableOpacity
            style={[
              styles.resumeButton,
              {
                backgroundColor: theme.colors.success,
                borderColor: theme.colors.success,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
            onPress={resumeSession}
          >
            <Text style={[styles.resumeButtonText, { color: theme.colors.text.onPrimary, fontFamily: theme.typography.fontFamily }]}>
              Resume
            </Text>
          </TouchableOpacity>
        )}

        {isActive && (
          <TouchableOpacity
            style={[
              styles.pauseButton,
              {
                backgroundColor: theme.colors.secondary,
                borderColor: theme.colors.secondary,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
            onPress={pauseSession}
          >
            <Text style={[styles.pauseButtonText, { color: theme.colors.text.onPrimary, fontFamily: theme.typography.fontFamily }]}>
              Pause
            </Text>
          </TouchableOpacity>
        )}

        {timeElapsed > 0 && (
          <TouchableOpacity
            style={[
              styles.finishButton,
              {
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
            onPress={onFinish}
          >
            <Text style={[styles.finishButtonText, { color: theme.colors.text.secondary, fontFamily: theme.typography.fontFamily }]}>
              Finish Early
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
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
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  progressTrack: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  timeContainer: {
    alignItems: 'center',
  },
  timeElapsed: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  totalTime: {
    fontSize: 16,
    marginTop: 4,
  },
  progressText: {
    fontSize: 14,
  },
  controls: {
    paddingHorizontal: 20,
    gap: 12,
  },
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    alignItems: 'center',
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pauseButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    alignItems: 'center',
  },
  pauseButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resumeButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    alignItems: 'center',
  },
  resumeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  finishButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
