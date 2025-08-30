import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated, StatusBar } from 'react-native';
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

    // Blinking cursor animation with better mobile support
    const blinkCursor = () => {
      const blinkLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: false, // Changed to false for better mobile support
          }),
          Animated.timing(cursorAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false, // Changed to false for better mobile support
          }),
        ])
      );
      blinkLoop.start();
      return blinkLoop;
    };

    let blinkAnimation = blinkCursor();

    // Start typing sequence
    const startTyping = () => {
      setIsTyping(true);
      // Stop blinking and keep cursor solid during typing
      blinkAnimation.stop();
      cursorAnim.setValue(1);
      
      let index = 0;
      const typeInterval = setInterval(() => {
        if (index < fullText.length) {
          setCurrentText(fullText.substring(0, index + 1));
          index++;
        } else {
          clearInterval(typeInterval);
          setIsTypingComplete(true);
          setIsTyping(false);
          
          // Start blinking again after typing
          blinkAnimation = blinkCursor();
          
          // Blink cursor a few more times, then hide it
          setTimeout(() => {
            blinkAnimation.stop();
            setShowCursor(false);
            // Transition to home screen
            setTimeout(() => {
              onFinish();
            }, 900); 
          }, 600);
        }
      }, 60); // Faster typing speed (was 100ms, now 60ms)
    };

    // Start typing after initial cursor blinks
    setTimeout(startTyping, 800);

  }, []); // Empty dependency array to prevent re-runs

  return (
    <>
      <StatusBar hidden={true} />
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
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f6f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 20,
    marginLeft: -15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 220,
    height: 220,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    width: '100%',
  },
  handwritingText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3f3f3d',
    fontFamily: 'System',
    fontStyle: 'normal',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cursor: {
    fontSize: 48,
    color: '#3f3f3d',
    fontWeight: 'bold',
  },
});
