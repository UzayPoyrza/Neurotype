import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, StatusBar } from 'react-native';
import { theme } from '../styles/theme';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Delay before starting fade-in (blank space)
    const fadeInDelay = setTimeout(() => {
      // Smooth fade in animation for icon and text (slower)
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 400); // Blank space for 600ms

    // Transition to home screen after showing content
    const timer = setTimeout(() => {
      onFinish();
    }, 2200); // Total: 600ms blank + 900ms fade-in + 700ms display

    return () => {
      clearTimeout(fadeInDelay);
      clearTimeout(timer);
    };
  }, []);

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

          {/* Text */}
          <View style={styles.textContainer}>
            <Text style={styles.handwritingText}>
              Neurotype
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
});
