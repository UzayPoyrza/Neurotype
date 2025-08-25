import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SessionDelta } from '../types';
import { Slider0to10 } from '../components/Slider0to10';
import { PrimaryButton } from '../components/PrimaryButton';
import { useStore } from '../store/useStore';
import { theme } from '../styles/theme';
import { TopNav } from '../components/TopNav';

type PlayerState = 'timer' | 'before' | 'after' | 'complete';

export const PlayerScreen: React.FC = () => {
  const [playerState, setPlayerState] = useState<PlayerState>('timer');
  const [timeLeft, setTimeLeft] = useState(0);
  const [beforeValue, setBeforeValue] = useState(5);
  const [afterValue, setAfterValue] = useState(5);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const { activeSession, setActiveSession, addSessionDelta } = useStore();

  useEffect(() => {
    if (activeSession) {
      setTimeLeft(activeSession.durationMin * 60);
      setPlayerState('timer');
      setBeforeValue(5);
      setAfterValue(5);
    }
  }, [activeSession]);

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
    if (!activeSession) return;

    const delta: SessionDelta = {
      date: new Date().toISOString().split('T')[0],
      before: beforeValue,
      after: afterValue
    };

    try {
      addSessionDelta(delta);

      Alert.alert('Session Saved!', 'Great job completing your session.');
      setActiveSession(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to save session. Please try again.');
    }
  };

  const closeSession = () => {
    setActiveSession(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activeSession) return null;

  return (
    <>
      <StatusBar hidden={true} />
      <View style={styles.container}>
        <TopNav 
          title={activeSession.title} 
          showBackButton={true}
          onBackPress={closeSession}
        />
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>

          {playerState === 'timer' && (
            <View style={styles.timerContainer}>
              <Text style={styles.timerLabel}>Ready to start?</Text>
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
              <PrimaryButton
                title="Start Session"
                onPress={startTimer}
                testID="start-session"
              />
            </View>
          )}

          {playerState === 'before' && (
            <View style={styles.feelingContainer}>
              <Text style={styles.feelingLabel}>How are you feeling right now?</Text>
              <Slider0to10
                value={beforeValue}
                onValueChange={setBeforeValue}
                label="Anxiety Level"
              />
              <PrimaryButton
                title="Begin Meditation"
                onPress={startSession}
                testID="begin-meditation"
              />
            </View>
          )}

          {playerState === 'after' && (
            <View style={styles.feelingContainer}>
              <Text style={styles.feelingLabel}>How are you feeling now?</Text>
              <Slider0to10
                value={afterValue}
                onValueChange={setAfterValue}
                label="Anxiety Level"
              />
              <PrimaryButton
                title="Save Session"
                onPress={saveSession}
                testID="save-session"
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },

  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerLabel: {
    color: '#2d3748',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    fontFamily: 'System',
    fontStyle: 'italic',
  },
  timerText: {
    fontSize: 80,
    fontWeight: '300',
    color: '#1a202c',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'System',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  feelingContainer: {
    paddingVertical: 20,
  },
  feelingLabel: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1a202c',
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: 'System',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
}); 