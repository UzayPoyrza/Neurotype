import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useStore } from '../store/useStore';
import { theme } from '../styles/theme';
import { Slider0to10 } from '../components/Slider0to10';
import { meditationAudioData, emotionalFeedbackData, sessionProgressData, mockAudioPlayer } from '../data/meditationMockData';

const { width: screenWidth } = Dimensions.get('window');

type PlayerState = 'ready' | 'playing' | 'paused' | 'finished';

export const MeditationPlayerScreen: React.FC = () => {
  const [playerState, setPlayerState] = useState<PlayerState>('ready');
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [emotionalRating, setEmotionalRating] = useState(5);
  const [currentSegment, setCurrentSegment] = useState<string>('');
  const [audioLoaded, setAudioLoaded] = useState(false);
  
  const { activeSession, setActiveSession } = useStore();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const playButtonScale = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef(mockAudioPlayer);

  useEffect(() => {
    if (activeSession) {
      const audioData = meditationAudioData[activeSession.id as keyof typeof meditationAudioData];
      if (audioData) {
        setTotalDuration(audioData.duration);
        setCurrentTime(0);
        setPlayerState('ready');
        setCurrentSegment(audioData.segments[0]?.text || '');
        
        // Load audio
        audioPlayerRef.current.loadAudio(audioData.backgroundAudio).then(() => {
          setAudioLoaded(true);
        });
      } else {
        // Fallback to duration in minutes
        setTotalDuration(activeSession.durationMin * 60);
        setCurrentTime(0);
        setPlayerState('ready');
      }
    }
  }, [activeSession]);

  useEffect(() => {
    if (playerState === 'playing' && currentTime < totalDuration) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          
          // Update current meditation segment
          if (activeSession) {
            const audioData = meditationAudioData[activeSession.id as keyof typeof meditationAudioData];
            if (audioData) {
              const currentSegmentData = audioData.segments.find(
                segment => newTime >= segment.start && newTime <= segment.end
              );
              if (currentSegmentData) {
                setCurrentSegment(currentSegmentData.text);
              }
            }
          }
          
          // Track emotional feedback every 30 seconds
          if (newTime % 30 === 0) {
            emotionalFeedbackData.trackEmotionalState(activeSession?.id || '', newTime, emotionalRating);
          }
          
          if (newTime >= totalDuration) {
            setPlayerState('finished');
            // Mark session as complete
            if (activeSession) {
              sessionProgressData.markSessionComplete(activeSession.id, totalDuration, emotionalRating);
            }
            return totalDuration;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [playerState, currentTime, totalDuration, activeSession, emotionalRating]);

  useEffect(() => {
    const progress = totalDuration > 0 ? currentTime / totalDuration : 0;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [currentTime, totalDuration, progressAnim]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(playButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(playButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (playerState === 'ready') {
      setPlayerState('playing');
      audioPlayerRef.current.play();
    } else if (playerState === 'playing') {
      setPlayerState('paused');
      audioPlayerRef.current.pause();
    } else if (playerState === 'paused') {
      setPlayerState('playing');
      audioPlayerRef.current.play();
    }
  };

  const handleFinish = () => {
    // Stop audio and save session
    audioPlayerRef.current.stop();
    if (activeSession) {
      sessionProgressData.markSessionComplete(activeSession.id, currentTime, emotionalRating);
    }
    setActiveSession(null);
  };

  const handleDiscard = () => {
    // Stop audio and close without saving
    audioPlayerRef.current.stop();
    setActiveSession(null);
  };

  const handleBack = () => {
    // Stop audio and close
    audioPlayerRef.current.stop();
    setActiveSession(null);
  };

  const handleTutorialToggle = () => {
    setShowTutorial(!showTutorial);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleOptions = () => {
    // Handle options menu
    console.log('Options pressed');
  };

  if (!activeSession) return null;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, screenWidth - 64],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background with meditation theme */}
      <View style={styles.backgroundOverlay} />
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBarButton} onPress={handleBack}>
          <Text style={styles.topBarButtonText}>←</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tutorialButton} onPress={handleTutorialToggle}>
          <Text style={styles.tutorialButtonText}>
            {showTutorial ? 'Skip tutorial' : 'Do tutorial'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.topBarButton} onPress={handleOptions}>
          <Text style={styles.topBarButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Session Title */}
        <View style={styles.titleSection}>
          <Text style={styles.sessionTitle}>{activeSession.title}</Text>
          <TouchableOpacity style={styles.heartButton} onPress={handleLike}>
            <Text style={[styles.heartIcon, isLiked && styles.heartIconLiked]}>
              {isLiked ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Artist/Creator */}
        <Text style={styles.artistName}>Prashanti Paz</Text>

        {/* Current Meditation Segment */}
        {currentSegment && playerState === 'playing' && (
          <View style={styles.segmentContainer}>
            <Text style={styles.segmentText}>{currentSegment}</Text>
          </View>
        )}

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack} />
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>-{formatTime(totalDuration - currentTime)}</Text>
          </View>
        </View>

        {/* Player Controls */}
        <View style={styles.playerControls}>
          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlIcon}>♪</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlIcon}>⏮</Text>
          </TouchableOpacity>
          
          <Animated.View style={{ transform: [{ scale: playButtonScale }] }}>
            <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
              <Text style={styles.playIcon}>
                {playerState === 'playing' ? '⏸' : '▶'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
          
          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlIcon}>⏭</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlIcon}>🔁</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {playerState === 'playing' && (
          <View style={styles.emotionalFeedbackSection}>
            <Text style={styles.emotionalFeedbackTitle}>How do you feel?</Text>
            <View style={styles.emotionalSliderContainer}>
              <Slider0to10
                value={emotionalRating}
                onValueChange={setEmotionalRating}
                label=""
                showLabels={false}
              />
            </View>
          </View>
        )}

        {(playerState === 'paused' || playerState === 'finished') && (
          <View style={styles.actionButtonsSection}>
            <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
              <Text style={styles.finishButtonText}>Finish</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
              <Text style={styles.discardButtonText}>Discard session</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 69, 19, 0.4)', // Warm brown overlay for meditation ambiance
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    zIndex: 10,
  },
  topBarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  topBarButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '400',
  },
  tutorialButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tutorialButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 12,
  },
  heartButton: {
    padding: 4,
  },
  heartIcon: {
    fontSize: 20,
  },
  heartIconLiked: {
    // Heart icon styling when liked
  },
  artistName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
  },
  segmentContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    maxWidth: '90%',
  },
  segmentText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  progressSection: {
    width: '100%',
    marginBottom: 40,
  },
  progressContainer: {
    position: 'relative',
    height: 4,
    marginBottom: 12,
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: {
    color: '#ffffff',
    fontSize: 18,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  playIcon: {
    color: '#1a1a1a',
    fontSize: 24,
    marginLeft: 2,
  },
  bottomSection: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  emotionalFeedbackSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emotionalFeedbackTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  emotionalSliderContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  actionButtonsSection: {
    alignItems: 'center',
    gap: 12,
  },
  finishButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  finishButtonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '600',
  },
  discardButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  discardButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
});
