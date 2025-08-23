import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, Alert, StyleSheet } from 'react-native';
import { Session, SessionDelta } from '../types';
import { Slider0to10 } from '../components/Slider0to10';
import { PrimaryButton } from '../components/PrimaryButton';
import { useStore } from '../store/useStore';


interface PlayerScreenProps {
  session: Session | null;
  visible: boolean;
  onClose: () => void;
}

type PlayerState = 'timer' | 'before' | 'after' | 'complete';

export const PlayerScreen: React.FC<PlayerScreenProps> = ({ 
  session, 
  visible, 
  onClose 
}) => {
  const [playerState, setPlayerState] = useState<PlayerState>('timer');
  const [timeLeft, setTimeLeft] = useState(0);
  const [beforeValue, setBeforeValue] = useState(5);
  const [afterValue, setAfterValue] = useState(5);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const addSessionDelta = useStore(state => state.addSessionDelta);

  useEffect(() => {
    if (session && visible) {
      setTimeLeft(session.durationMin * 60);
      setPlayerState('timer');
      setBeforeValue(5);
      setAfterValue(5);
    }
  }, [session, visible]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setPlayerState('after');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const startTimer = () => {
    setPlayerState('before');
  };

  const startSession = () => {
    setPlayerState('timer');
    setIsTimerRunning(true);
  };

  const saveSession = () => {
    if (!session) return;

    const delta: SessionDelta = {
      date: new Date().toISOString().split('T')[0],
      before: beforeValue,
      after: afterValue
    };

    try {
      addSessionDelta(delta);

      Alert.alert('Session Saved!', 'Great job completing your session.');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save session. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!session) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {session.title}
          </Text>
          <Text style={styles.subtitle}>
            {session.durationMin} min • {session.modality}
          </Text>
        </View>

        <ScrollView style={styles.content}>
          {playerState === 'timer' && (
            <View style={styles.timerContainer}>
              <View style={styles.timerCard}>
                <Text style={styles.timerText}>
                  {formatTime(timeLeft)}
                </Text>
                <Text style={styles.timerStatus}>
                  {isTimerRunning ? 'Session in progress...' : 'Ready to begin'}
                </Text>
              </View>
              
              {!isTimerRunning && (
                <PrimaryButton
                  title="Start Session"
                  onPress={startSession}
                  testID="start-session-timer"
                />
              )}
            </View>
          )}

          {playerState === 'before' && (
            <View style={styles.checkinContainer}>
              <Text style={styles.checkinTitle}>
                How are you feeling right now?
              </Text>
              <Slider0to10
                value={beforeValue}
                onValueChange={setBeforeValue}
                label="Anxiety Level"
              />
              <PrimaryButton
                title="Continue"
                onPress={startTimer}
                testID="continue-to-session"
              />
            </View>
          )}

          {playerState === 'after' && (
            <View style={styles.checkinContainer}>
              <Text style={styles.checkinTitle}>
                How are you feeling now?
              </Text>
              <Slider0to10
                value={afterValue}
                onValueChange={setAfterValue}
                label="Anxiety Level"
              />
              <PrimaryButton
                title="Save Session"
                onPress={saveSession}
                testID="save-session"
                disabled={afterValue === 5} // Default value means not selected
              />
            </View>
          )}

          {playerState === 'complete' && (
            <View style={styles.completeContainer}>
              <Text style={styles.completeTitle}>
                Session Complete!
              </Text>
              <Text style={styles.completeText}>
                You've reduced your anxiety by {beforeValue - afterValue} points.
              </Text>
              <PrimaryButton
                title="Close"
                onPress={onClose}
                variant="secondary"
              />
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6b7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  timerText: {
    fontSize: 60,
    fontWeight: '300',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  timerStatus: {
    color: '#6b7280',
    textAlign: 'center',
  },
  checkinContainer: {
    paddingVertical: 16,
  },
  checkinTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  completeContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  completeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  completeText: {
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
}); 