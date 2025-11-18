import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, StatusBar, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';

interface OnboardingScreenProps {
  onFinish: () => void;
}

// Simple icon components for features
const FeatureIcon: React.FC<{ icon: string; color: string }> = ({ icon, color }) => (
  <View style={[styles.featureIconContainer, { backgroundColor: color }]}>
    <Text style={styles.iconText}>{icon}</Text>
  </View>
);

const FeaturePoint: React.FC<{
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  delay: number;
}> = ({ icon, iconColor, title, description, delay }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        delay: delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.featurePoint,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <FeatureIcon icon={icon} color={iconColor} />
      <View style={styles.featureTextContainer}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </Animated.View>
  );
};

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.95)).current;
  const disclaimerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Icon animation - fade in and scale up
    Animated.parallel([
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Title animation
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 600,
        delay: 600,
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 600,
        delay: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Disclaimer animation
    Animated.timing(disclaimerOpacity, {
      toValue: 1,
      duration: 600,
      delay: 1800,
      useNativeDriver: true,
    }).start();

    // Button animation
    Animated.parallel([
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 600,
        delay: 2000,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 2000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.container}>
        {/* App Icon */}
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              opacity: iconOpacity,
              transform: [{ scale: iconScale }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Image
              source={require('../../assets/icon_no_background.png')}
              style={styles.icon}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.title}>Welcome to Neurotype</Text>
        </Animated.View>

        {/* Feature Points */}
        <View style={styles.featuresContainer}>
          <FeaturePoint
            icon="🧠"
            iconColor="#3f3f3d"
            title="Personalized for Your Brain"
            description="Discover meditation methods proven\nto work for your unique neurotype."
            delay={900}
          />
          <FeaturePoint
            icon="📊"
            iconColor="#3f3f3d"
            title="Track Your Progress"
            description="See how meditation affects your\nanxiety, focus, and well-being over time."
            delay={1100}
          />
          <FeaturePoint
            icon="📚"
            iconColor="#3f3f3d"
            title="All Your Sessions in One Place"
            description="Access guided meditations, modules,\nand techniques tailored to your goals."
            delay={1300}
          />
        </View>

        {/* Disclaimer */}
        <Animated.View style={[styles.disclaimerContainer, { opacity: disclaimerOpacity }]}>
          <View style={styles.disclaimerIcon}>
            <Text style={styles.disclaimerIconText}>👥</Text>
          </View>
          <Text style={styles.disclaimerText}>
            Your meditation data and progress are used to improve your personalized experience.
          </Text>
        </Animated.View>

        {/* Continue Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: buttonOpacity,
              transform: [{ scale: buttonScale }],
            },
          ]}
        >
          <TouchableOpacity style={styles.button} onPress={onFinish} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  iconWrapper: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 26,
    backgroundColor: '#f8f6f1',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  icon: {
    width: 100,
    height: 100,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  featuresContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  featurePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 28,
  },
  featureTextContainer: {
    flex: 1,
    paddingTop: 4,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 20,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  disclaimerIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  disclaimerIconText: {
    fontSize: 14,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#8e8e93',
    lineHeight: 16,
  },
  buttonContainer: {
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
});

