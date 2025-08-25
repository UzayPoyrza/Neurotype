import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { theme } from '../styles/theme';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cursorAnim = useRef(new Animated.Value(1)).current;
  const [currentText, setCurrentText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  
  const fullText = 'Neurotype';

  useEffect(() => {
    // Quick fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Blinking cursor animation
    const blinkCursor = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(cursorAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(cursorAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    blinkCursor();

    // Start typing sequence
    const startTyping = () => {
      setIsTyping(true);
      let index = 0;
      const typeInterval = setInterval(() => {
        if (index < fullText.length) {
          setCurrentText(fullText.substring(0, index + 1));
          index++;
        } else {
          clearInterval(typeInterval);
          setIsTypingComplete(true);
          setIsTyping(false);
          
          // Blink cursor a few more times, then hide it
          setTimeout(() => {
            setShowCursor(false);
            // Transition to home screen
            setTimeout(() => {
              onFinish();
            }, 500);
          }, 1200);
        }
      }, 60); // Faster typing speed (was 100ms, now 60ms)
    };

    // Start typing after initial cursor blinks
    setTimeout(startTyping, 800);

  }, []); // Empty dependency array to prevent re-runs

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        {/* App Icon */}
        <View style={styles.iconContainer}>
          <Image 
            source={require('../../assets/icon_no_background.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>

        {/* Typing Text */}
        <View style={styles.textContainer}>
          <Text style={styles.handwritingText}>
            {currentText}
            {showCursor && !isTyping && (
              <Animated.Text style={[styles.cursor, { opacity: cursorAnim }]}>
                |
              </Animated.Text>
            )}
            {showCursor && isTyping && (
              <Text style={styles.cursor}>
                |
              </Text>
            )}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: theme.spacing.xxxl,
  },
  icon: {
    width: 120,
    height: 120,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  handwritingText: {
    fontSize: 32,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'System',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  cursor: {
    fontSize: 32,
    color: '#000000',
    fontWeight: '400',
  },
});
