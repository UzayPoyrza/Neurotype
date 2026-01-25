import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, Animated, StatusBar, TouchableOpacity, ScrollView, Dimensions, TextInput, KeyboardAvoidingView, Platform, Easing, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../styles/theme';
import { mentalHealthModules, MentalHealthModule } from '../data/modules';
import { prerenderedModuleBackgrounds } from '../store/useStore';
import { useStore } from '../store/useStore';
import { AnimatedFloatingButton } from '../components/AnimatedFloatingButton';
import { ModuleGridModal } from '../components/ModuleGridModal';
import { Slider0to10 } from '../components/Slider0to10';
import { signInWithGoogle, signInWithApple } from '../services/authService';
import { showErrorAlert, ERROR_TITLES } from '../utils/errorHandler';
import { supabase } from '../services/supabase';
import { getUserProfile, createUserProfile, isPremiumUser } from '../services/userService';
import { PaymentPage } from '../components/PaymentPage';
import { PremiumFeaturesPage } from '../components/PremiumFeaturesPage';
import { TermsOfServiceScreen } from './TermsOfServiceScreen';
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen';
import { ConsumerHealthDataPrivacyScreen } from './ConsumerHealthDataPrivacyScreen';

interface OnboardingScreenProps {
  onFinish: (skipped?: boolean) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Feature Icon Component with Apple style
const FeatureIcon: React.FC<{ icon: string }> = ({ icon }) => (
  <View style={styles.featureIconContainer}>
    <Text style={styles.iconText}>{icon}</Text>
  </View>
);

const FeaturePoint: React.FC<{
  icon: string;
  title: string;
  description: string;
  delay: number;
  isActive?: boolean;
}> = ({ icon, title, description, delay, isActive = true }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (isActive) {
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
    }
  }, [isActive]);

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
      <FeatureIcon icon={icon} />
      <View style={styles.featureTextContainer}>
        <Text style={styles.featureTitleLight}>{title}</Text>
        <Text style={styles.featureDescriptionLight}>{description}</Text>
      </View>
    </Animated.View>
  );
};

// Welcome Page Component
const WelcomePage: React.FC = () => {
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
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
  }, []);

  return (
    <View style={styles.page}>
      <View style={styles.pageBackground}>
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

        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.titleLight}>Welcome to Neurotype</Text>
        </Animated.View>

        <View style={styles.featuresContainer}>
          <FeaturePoint
            icon="🧠"
            title="Personalized for Your Brain"
            description="Discover meditation methods proven to work for your unique neurotype."
            delay={900}
          />
          <FeaturePoint
            icon="📊"
            title="Track Your Progress"
            description="See how meditation affects your anxiety, focus, and well-being over time."
            delay={1100}
          />
          <FeaturePoint
            icon="📚"
            title="All Your Sessions in One Place"
            description="Access guided meditations, modules, and techniques tailored to your goals."
            delay={1300}
          />
        </View>
      </View>
    </View>
  );
};

// Select Module Page Component
const SelectModulePage: React.FC<{ 
  selectedModule: string | null;
  onSelectModule: (moduleId: string) => void;
  isActive: boolean;
}> = ({ selectedModule, onSelectModule, isActive }) => {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const hasAnimated = useRef(false);
  const [showScrollArrow, setShowScrollArrow] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const arrowOpacity = useRef(new Animated.Value(1)).current;
  const [scrollViewHeight, setScrollViewHeight] = useState(0);

  useEffect(() => {
    if (isActive && !hasAnimated.current) {
      hasAnimated.current = true;
      // Reset scroll arrow state when page first becomes active
      setShowScrollArrow(true);
      arrowOpacity.setValue(1);
      
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 600,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!isActive) {
      // Reset when page becomes inactive
      hasAnimated.current = false;
    }
  }, [isActive]);

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
    const isScrollable = contentSize.height > layoutMeasurement.height;
    
    // Only hide arrow when scrolled to bottom, not when content fits on screen
    if (isScrollable) {
      if (isAtBottom && showScrollArrow) {
        setShowScrollArrow(false);
        Animated.timing(arrowOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else if (!isAtBottom && !showScrollArrow) {
        setShowScrollArrow(true);
        Animated.timing(arrowOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const handleContentSizeChange = (contentWidth: number, contentHeight: number) => {
    // Check if content is scrollable when content size changes
    if (scrollViewHeight > 0) {
      const isScrollable = contentHeight > scrollViewHeight;
      if (isScrollable) {
        // Show arrow if content is scrollable (will be hidden by handleScroll if at bottom)
        if (!showScrollArrow) {
          setShowScrollArrow(true);
          Animated.timing(arrowOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      }
    }
  };

  const handleScrollViewLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setScrollViewHeight(height);
  };

  return (
    <View style={styles.page}>
      <View style={styles.pageBackground}>
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.titleLight}>Select Your Focus</Text>
          <Text style={styles.subtitleLight}>Choose a module to get started</Text>
        </Animated.View>

      <View style={styles.modulesWrapper}>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.modulesScrollView}
          contentContainerStyle={styles.modulesContainer}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          onContentSizeChange={handleContentSizeChange}
          onLayout={handleScrollViewLayout}
          scrollEventThrottle={16}
        >
          {[...mentalHealthModules]
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((module) => {
            const isSelected = selectedModule === module.id;
            
            return (
              <TouchableOpacity
                key={module.id}
                style={[
                  styles.moduleCard,
                  isSelected && styles.moduleCardSelected,
                ]}
                onPress={() => onSelectModule(module.id)}
                activeOpacity={0.7}
              >
                <View style={styles.moduleCardContent}>
                  <View style={styles.moduleCardHeader}>
                    <View style={styles.moduleTitleContainer}>
                      <Text style={styles.moduleTitle}>{module.title}</Text>
                      <View style={[styles.moduleCategoryBadge, { backgroundColor: module.color }]}>
                        <Text style={styles.moduleCategoryText}>{module.category}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.moduleDescription}>{module.description}</Text>
                  {isSelected && (
                    <View style={styles.checkmarkContainer}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        {showScrollArrow && (
          <Animated.View 
            style={[
              styles.scrollArrowContainer,
              { opacity: arrowOpacity }
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={['rgba(242, 242, 247, 0)', 'rgba(242, 242, 247, 0.4)', 'rgba(242, 242, 247, 0.8)', 'rgba(242, 242, 247, 1)']}
              locations={[0, 0.3, 0.7, 1]}
              style={styles.scrollArrowGradient}
            >
              <View style={styles.scrollArrow}>
                <Text style={styles.scrollArrowText}>⌄</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}
      </View>
      </View>
    </View>
  );
};

// Confetti Particle Component
const ConfettiParticle: React.FC<{
  index: number;
  visible: boolean;
  angle: number;
  radius: number;
  color: string;
}> = ({ index, visible, angle, radius, color }) => {
  const particleOpacity = useRef(new Animated.Value(0)).current;
  const particleTranslateX = useRef(new Animated.Value(0)).current;
  const particleTranslateY = useRef(new Animated.Value(0)).current;
  const particleScale = useRef(new Animated.Value(0)).current;

  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(particleOpacity, {
          toValue: 1,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(particleTranslateX, {
          toValue: x,
          duration: 800,
          delay: index * 50,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(particleTranslateY, {
          toValue: y,
          duration: 800,
          delay: index * 50,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(particleScale, {
          toValue: 1,
          tension: 40,
          friction: 7,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset when not visible
      particleOpacity.setValue(0);
      particleTranslateX.setValue(0);
      particleTranslateY.setValue(0);
      particleScale.setValue(0);
    }
  }, [visible, x, y, index]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: color,
        opacity: particleOpacity,
        transform: [
          { translateX: particleTranslateX },
          { translateY: particleTranslateY },
          { scale: particleScale },
        ],
      }}
    />
  );
};

// Congratulations Overlay Component
export const CongratulationsOverlay: React.FC<{
  visible: boolean;
  moduleTitle: string;
  moduleColor: string;
  onComplete: () => void;
}> = ({ visible, moduleTitle, moduleColor, onComplete }) => {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkRotation = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const messageTranslateY = useRef(new Animated.Value(20)).current;
  const confettiOpacity = useRef(new Animated.Value(0)).current;
  const confettiScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      // Reset values
      overlayOpacity.setValue(0);
      checkmarkScale.setValue(0);
      checkmarkRotation.setValue(0);
      messageOpacity.setValue(0);
      messageTranslateY.setValue(20);
      confettiOpacity.setValue(0);
      confettiScale.setValue(0.5);

      // Animate overlay fade in
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Animate confetti
      Animated.parallel([
        Animated.timing(confettiOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(confettiScale, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate checkmark with rotation
      Animated.sequence([
        Animated.parallel([
          Animated.spring(checkmarkScale, {
            toValue: 1.2,
            tension: 30,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(checkmarkRotation, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(checkmarkScale, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate message
      Animated.parallel([
        Animated.timing(messageOpacity, {
          toValue: 1,
          duration: 500,
          delay: 300,
          useNativeDriver: true,
        }),
        Animated.timing(messageTranslateY, {
          toValue: 0,
          duration: 500,
          delay: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      // Fade out overlay after showing for a bit, then call onComplete
      setTimeout(() => {
        // Fade out overlay
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          onComplete();
        });
      }, 2000);
    } else {
      // Reset when not visible
      overlayOpacity.setValue(0);
      checkmarkScale.setValue(0);
      checkmarkRotation.setValue(0);
      messageOpacity.setValue(0);
      messageTranslateY.setValue(20);
      confettiOpacity.setValue(0);
      confettiScale.setValue(0.5);
    }
  }, [visible, onComplete]);

  if (!visible) return null;

  const checkmarkRotate = checkmarkRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
  const particleCount = 12;

  return (
    <Animated.View
      style={[
        styles.congratulationsOverlay,
        {
          opacity: overlayOpacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.confettiContainer,
          {
            opacity: confettiOpacity,
            transform: [{ scale: confettiScale }],
          },
        ]}
      >
        {Array.from({ length: particleCount }).map((_, i) => {
          const angle = (i * 360) / particleCount;
          return (
            <ConfettiParticle
              key={i}
              index={i}
              visible={visible}
              angle={angle}
              radius={120}
              color={colors[i % colors.length]}
            />
          );
        })}
      </Animated.View>

      <Animated.View
        style={[
          styles.congratulationsCheckmarkContainer,
          {
            transform: [
              { scale: checkmarkScale },
              { rotate: checkmarkRotate },
            ],
          },
        ]}
      >
        <View style={[styles.congratulationsCheckmarkCircle, { backgroundColor: moduleColor }]}>
          <Text style={styles.congratulationsCheckmarkText}>✓</Text>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.congratulationsMessage,
          {
            opacity: messageOpacity,
            transform: [{ translateY: messageTranslateY }],
          },
        ]}
      >
        <Text style={styles.congratulationsTitle}>Successfully Changed</Text>
        <Text style={styles.congratulationsSubtitle}>
          You've changed to {moduleTitle}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

// Change Button Demo Page
export const ChangeButtonDemoPage: React.FC<{ 
  selectedModule: string | null;
  isActive: boolean;
  onModuleChange?: (moduleId: string) => void;
  onShowModal?: () => void;
  previousModuleId?: string | null;
  onShowCongratulations?: (show: boolean) => void;
  onCongratulationsComplete?: (handler: () => void) => void;
}> = ({ selectedModule, isActive, onModuleChange, onShowModal, previousModuleId, onShowCongratulations, onCongratulationsComplete }) => {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);
  const [isPillMode, setIsPillMode] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [showInstructionText, setShowInstructionText] = useState(false);
  const hasShownCongratulations = useRef(false); // Track if congratulations has been shown once
  
  // Button animation values
  const buttonWidth = useRef(new Animated.Value(80)).current; // Larger initial size
  const textOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  const buttonTranslateX = useRef(new Animated.Value(0)).current;
  
  // Instructional text animation values
  const instructionTextOpacity = useRef(new Animated.Value(0)).current;
  const instructionTextTranslateY = useRef(new Animated.Value(20)).current;
  
  // Arrow animation values - use refs to persist across re-renders
  const arrowOpacity = useRef(new Animated.Value(0)).current;
  const arrowTranslateY = useRef(new Animated.Value(8)).current;
  const pulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const arrowAnimationStartedRef = useRef(false); // Track if animation has been started
  const isAnimatingRef = useRef(false); // Track if currently animating to prevent interruptions

  const selectedModuleData = mentalHealthModules.find(m => m.id === selectedModule) || mentalHealthModules[0];
  const buttonColor = selectedModuleData.color;

  // Detect module change and show congratulations (only once)
  useEffect(() => {
    // Only show congratulations if:
    // 1. Page is active
    // 2. There's a selected module
    // 3. There was a previous module (not initial load)
    // 4. The module actually changed
    // 5. Congratulations hasn't been shown before
    if (isActive && selectedModule && previousModuleId && selectedModule !== previousModuleId && !hasShownCongratulations.current) {
      // Module has changed for the first time, show congratulations
      hasShownCongratulations.current = true;
      setShowCongratulations(true);
      if (onShowCongratulations) {
        onShowCongratulations(true);
      }
      // Hide and reset instruction text if it was showing
      if (showInstructionText) {
        setShowInstructionText(false);
        instructionTextOpacity.setValue(0);
        instructionTextTranslateY.setValue(20);
      }
    }
  }, [selectedModule, previousModuleId, isActive, showInstructionText]);

  // Initialize previous module when page becomes active
  useEffect(() => {
    if (isActive && selectedModule && !previousModuleId) {
      // Set initial previous module when page first becomes active
      // This prevents congratulations from showing on initial load
    }
  }, [isActive, selectedModule, previousModuleId]);

  const startArrowAnimation = useCallback(() => {
    // Only start once, never restart
    if (arrowAnimationStartedRef.current) {
      return; // Animation already started, never restart
    }
    
    arrowAnimationStartedRef.current = true;
    
    // Reset initial values only on first start
    arrowOpacity.setValue(0);
    arrowTranslateY.setValue(8);
    
    // Fade in and move to center
    Animated.parallel([
      Animated.timing(arrowOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(arrowTranslateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Only start pulse if it's not already running
      if (pulseAnimationRef.current || isAnimatingRef.current) {
        return;
      }
      
      isAnimatingRef.current = true;
      
      // Create butter-smooth continuous animation
      // Use a simple alternating pattern that never resets
      let isGoingUp = false; // Track direction
      
      const animateCycle = () => {
        // Alternate between going up (-8) and down (0)
        const targetValue = isGoingUp ? 0 : -8;
        isGoingUp = !isGoingUp; // Toggle for next cycle
        
        // Create smooth animation to target
        const animation = Animated.timing(arrowTranslateY, {
          toValue: targetValue,
          duration: 1000,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1.0), // Material Design standard easing
          useNativeDriver: true,
        });
        
        // Start animation and immediately queue next cycle when done
        animation.start(() => {
          // Immediately start next cycle - no gap, no reset, seamless
          if (isAnimatingRef.current) {
            animateCycle();
          }
        });
      };
      
      // Start the first cycle (going up to -8)
      animateCycle();
    });
  }, [arrowOpacity, arrowTranslateY]);

  const startAnimationCycle = () => {
    // Clear any existing timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Reset to initial state
    setIsPillMode(false);
    buttonWidth.setValue(80);
    textOpacity.setValue(0);
    iconScale.setValue(1);

    // Trigger pill animation after 2 seconds
    animationTimeoutRef.current = setTimeout(() => {
      setIsPillMode(true);
    }, 2000);
  };

  // Start arrow animation immediately on mount, independent of isActive
  useEffect(() => {
    // Start arrow animation once on mount - never restart
    const timer = setTimeout(() => {
      startArrowAnimation();
    }, 800);
    
    return () => {
      clearTimeout(timer);
    };
  }, [startArrowAnimation]); // Only depend on startArrowAnimation, not isActive

  useEffect(() => {
    if (isActive && !hasAnimated.current) {
      hasAnimated.current = true;
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }).start();

      startAnimationCycle();
    }
  }, [isActive]);

  // When module changes, only restart button animation, NOT arrow animation
  useEffect(() => {
    if (isActive && hasAnimated.current) {
      // Don't restart arrow animation - let it continue smoothly
      startAnimationCycle();
    }
  }, [selectedModule]);

  // Animate to pill mode
  useEffect(() => {
    if (isPillMode) {
      const pillWidth = 200; // Larger pill width for demo
      Animated.parallel([
        Animated.timing(buttonWidth, {
          toValue: pillWidth,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 200,
          delay: 150,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // After expanding, collapse back after 2 seconds
        animationTimeoutRef.current = setTimeout(() => {
          // Hide text immediately before collapsing
          Animated.timing(textOpacity, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }).start(() => {
            // Then collapse the button width
            Animated.timing(buttonWidth, {
              toValue: 80,
              duration: 300,
              useNativeDriver: false,
            }).start(() => {
              setIsPillMode(false);
              // Restart the cycle after collapsing
              animationTimeoutRef.current = setTimeout(() => {
                startAnimationCycle();
              }, 1000);
            });
          });
        }, 2000);
      });
    }
  }, [isPillMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (pulseAnimationRef.current) {
        pulseAnimationRef.current.stop();
      }
    };
  }, []);

  const handleCongratulationsComplete = () => {
    // Show instructional text after a short delay
    setTimeout(() => {
      setShowInstructionText(true);
      Animated.parallel([
        Animated.timing(instructionTextOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(instructionTextTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }, 300);
  };

  // Expose handleCongratulationsComplete to parent
  useEffect(() => {
    if (onCongratulationsComplete) {
      onCongratulationsComplete(handleCongratulationsComplete);
    }
  }, [onCongratulationsComplete]);

  return (
    <View style={styles.page}>
      <View style={styles.pageBackground}>
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
            },
          ]}
        >
          <Text style={styles.titleLight}>You Can Change Anytime</Text>
          <Text style={styles.subtitleLight}>Tap the change button to switch modules</Text>
        </Animated.View>

      <View style={styles.demoContainer}>
        <View style={styles.demoModuleCard}>
          <View style={styles.demoModuleHeader}>
            <Text style={styles.demoModuleTitle}>{selectedModuleData.title}</Text>
            <View style={[styles.demoModuleCategoryBadge, { backgroundColor: selectedModuleData.color }]}>
              <Text style={styles.demoModuleCategoryText}>{selectedModuleData.category}</Text>
            </View>
          </View>
          <Text style={styles.demoModuleDescription}>{selectedModuleData.description}</Text>
        </View>

        {/* Animated Arrow pointing to button */}
        <Animated.View
          style={[
            styles.arrowPointer,
            {
              opacity: arrowOpacity,
              transform: [{ translateY: arrowTranslateY }],
            }
          ]}
        >
          <Text style={styles.arrowPointerText}>↓</Text>
        </Animated.View>

        {/* Demo Change Button - Large, non-draggable */}
        <Animated.View
          style={[
            styles.demoChangeButtonContainer,
            {
              transform: [{ translateX: buttonTranslateX }],
            }
          ]}
        >
          <Animated.View
            style={[
              styles.demoChangeButtonBackground,
              {
                backgroundColor: buttonColor,
                width: buttonWidth,
              }
            ]}
          >
            <TouchableOpacity
              style={styles.demoChangeButtonContent}
              onPress={() => {
                if (onShowModal) {
                  onShowModal();
                }
              }}
              activeOpacity={0.8}
              disabled={false}
            >
              <View style={styles.demoChangeButtonInner}>
                <Animated.View
                  style={[
                    styles.demoChangeIconContainer,
                    {
                      transform: [{ scale: iconScale }],
                      right: 16,
                    }
                  ]}
                >
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 6V3L8 7l4 4V8c3.31 0 6 2.69 6 6 0 .34-.03.67-.08 1h2.02c.04-.33.06-.66.06-1 0-4.42-3.58-8-8-8zM6 12c0-.34.03-.67.08-1H2.06c-.04.33-.06.66-.06 1 0 4.42 3.58 8 8 8v3l4-4-4-4v3c-3.31 0-6-2.69-6-6z"
                      fill="#ffffff"
                    />
                  </Svg>
                </Animated.View>
                
                <Animated.View
                  style={[
                    styles.demoChangeTextContainer,
                    {
                      opacity: textOpacity,
                      right: 60,
                    }
                  ]}
                >
                  <Text style={styles.demoChangeText}>Change</Text>
                </Animated.View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
        
        {/* Instructional Text - appears after congratulations */}
        {showInstructionText && (
          <Animated.View
            style={[
              styles.instructionTextContainer,
              {
                opacity: instructionTextOpacity,
                transform: [{ translateY: instructionTextTranslateY }],
              },
            ]}
          >
            <Text style={styles.instructionText}>
              Great! Now you've learned how to change modules.{'\n'}
              Click 'Continue' to learn how the app works.
            </Text>
          </Animated.View>
        )}
      </View>

      </View>
    </View>
  );
};

// Sticker Badge Component - Looks like a sticker attached to the card
const StickerBadge: React.FC<{
  text: string;
  delay?: number;
  isActive?: boolean;
  bottomOffset?: number;
}> = ({ text, delay = 0, isActive = true, bottomOffset = -16 }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(-8)).current; // Slight rotation like a sticker
  const liftY = useRef(new Animated.Value(0)).current; // Subtle lift animation
  const liftAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isActive) {
      // Initial sticker "stick" animation - pops in with rotation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          delay: delay,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 40,
          friction: 6,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.spring(rotate, {
          toValue: -5, // Final slight rotation
          tension: 30,
          friction: 7,
          delay: delay,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Subtle lift animation - like sticker slightly peeling
        const createLiftAnimation = () => {
          return Animated.sequence([
            Animated.timing(liftY, {
              toValue: -2,
              duration: 2000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(liftY, {
              toValue: 0,
              duration: 2000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]);
        };

        const startLift = () => {
          liftAnimationRef.current = createLiftAnimation();
          liftAnimationRef.current.start(() => {
            if (isActive) {
              startLift(); // Loop the animation
            }
          });
        };

        startLift();
      });
    } else {
      // Reset when not active
      if (liftAnimationRef.current) {
        liftAnimationRef.current.stop();
      }
      opacity.setValue(0);
      scale.setValue(0);
      rotate.setValue(-8);
      liftY.setValue(0);
    }

    return () => {
      if (liftAnimationRef.current) {
        liftAnimationRef.current.stop();
      }
    };
  }, [isActive, delay]);

  const rotateDeg = rotate.interpolate({
    inputRange: [-10, 10],
    outputRange: ['-10deg', '10deg'],
  });

  return (
    <Animated.View
      style={[
        styles.stickerBadge,
        {
          opacity,
          bottom: bottomOffset,
          transform: [
            { scale },
            { rotate: rotateDeg },
            { translateY: liftY },
          ],
        },
      ]}
    >
      <View style={styles.stickerBadgeInner}>
        <Text style={styles.stickerBadgeText}>{text}</Text>
      </View>
    </Animated.View>
  );
};

// How to Use App Page
export const HowToUsePage: React.FC<{ 
  isActive: boolean;
  onScrollStateChange?: (hasScrolled: boolean) => void;
  isModal?: boolean;
}> = ({ isActive, onScrollStateChange, isModal = false }) => {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const demoOpacity = useRef(new Animated.Value(0)).current;
  const demoTranslateY = useRef(new Animated.Value(20)).current;
  const step1Opacity = useRef(new Animated.Value(0)).current;
  const step2Opacity = useRef(new Animated.Value(0)).current;
  const step3Opacity = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const sliderAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollArrow, setShowScrollArrow] = useState(true);
  const arrowOpacity = useRef(new Animated.Value(1)).current;
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  
  // Slider demo animation
  const startSliderDemo = useCallback(() => {
    // Reset to 0
    setFeedbackRating(0);
    
    // Animate from 0 to 8 over 2 seconds, then back to 5
    const animateSlider = () => {
      // Go from 0 to 8
      let currentValue = 0;
      const interval = setInterval(() => {
        currentValue += 0.5;
        if (currentValue <= 8) {
          setFeedbackRating(Math.round(currentValue));
        } else {
          clearInterval(interval);
          // After reaching 8, wait a bit then go to 5
          setTimeout(() => {
            let value = 8;
            const returnInterval = setInterval(() => {
              value -= 0.3;
              if (value >= 5) {
                setFeedbackRating(Math.round(value));
              } else {
                clearInterval(returnInterval);
                setFeedbackRating(5);
                // Loop the animation
                setTimeout(() => {
                  startSliderDemo();
                }, 1500);
              }
            }, 30);
          }, 800);
        }
      }, 50);
    };

    // Start animation after a short delay
    sliderAnimationRef.current = setTimeout(() => {
      animateSlider();
    }, 500);
  }, []);
  
  // Get a sample module and sessions for demo
  const selectedModule = mentalHealthModules.find(m => m.id === 'anxiety') || mentalHealthModules[0];
  const demoRecommendedSession = {
    id: 'demo-1',
    title: 'Ocean Waves Meditation',
    durationMin: 5,
    modality: 'sound',
    goal: 'anxiety',
    adaptiveReason: 'Based on your recent progress',
  };
  const demoAlternativeSessions = [
    { id: 'demo-2', title: 'Mountain Visualization', durationMin: 6, modality: 'visualization' },
    { id: 'demo-3', title: 'Body Scan Journey', durationMin: 8, modality: 'somatic' },
  ];

  useEffect(() => {
    if (isActive && !hasAnimated.current) {
      hasAnimated.current = true;
      // Reset scroll arrow state when page first becomes active
      setShowScrollArrow(true);
      arrowOpacity.setValue(1);
      
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 600,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(demoOpacity, {
          toValue: 1,
          duration: 600,
          delay: 400,
          useNativeDriver: true,
        }),
        Animated.timing(demoTranslateY, {
          toValue: 0,
          duration: 600,
          delay: 400,
          useNativeDriver: true,
        }),
        Animated.timing(step1Opacity, {
          toValue: 1,
          duration: 600,
          delay: 800,
          useNativeDriver: true,
        }),
        Animated.timing(step2Opacity, {
          toValue: 1,
          duration: 600,
          delay: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(step3Opacity, {
          toValue: 1,
          duration: 600,
          delay: 1200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Start slider demo animation after step 3 appears
        if (isActive) {
          startSliderDemo();
        }
      });
    } else if (!isActive) {
      // Reset when page becomes inactive
      hasAnimated.current = false;
    }

    return () => {
      if (sliderAnimationRef.current) {
        clearTimeout(sliderAnimationRef.current);
      }
    };
  }, [isActive, startSliderDemo]);

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
    const isScrollable = contentSize.height > layoutMeasurement.height;
    
    // Only hide arrow when scrolled to bottom, not when content fits on screen
    if (isScrollable) {
      if (isAtBottom && showScrollArrow) {
        setShowScrollArrow(false);
        if (onScrollStateChange) {
          onScrollStateChange(true);
        }
        Animated.timing(arrowOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else if (!isAtBottom && !showScrollArrow) {
        setShowScrollArrow(true);
        if (onScrollStateChange) {
          onScrollStateChange(false);
        }
        Animated.timing(arrowOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else if (!isAtBottom && onScrollStateChange) {
        // Still scrolling but not at bottom
        onScrollStateChange(false);
      }
    }
  };

  const handleContentSizeChange = (contentWidth: number, contentHeight: number) => {
    // Check if content is scrollable when content size changes
    if (scrollViewHeight > 0) {
      const isScrollable = contentHeight > scrollViewHeight;
      if (isScrollable) {
        // Show arrow if content is scrollable (will be hidden by handleScroll if at bottom)
        if (!showScrollArrow) {
          setShowScrollArrow(true);
          Animated.timing(arrowOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      }
    }
  };

  const handleScrollViewLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setScrollViewHeight(height);
  };

  return (
    <View style={styles.page}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.page} 
        contentContainerStyle={styles.howToUseScrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleScrollViewLayout}
        scrollEventThrottle={16}
      >
      <View style={isModal ? styles.howToUsePageBackgroundModal : styles.howToUsePageBackground}>
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.titleLight}>How to Use the App</Text>
          <Text style={styles.subtitleLight}>Here's where to find your daily meditation</Text>
        </Animated.View>

      {/* Step 1: Find Today's Focus */}
      <Animated.View
        style={[
          styles.stepContainer,
          { opacity: step1Opacity },
        ]}
      >
        <View style={styles.stepHeader}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={styles.stepTitle}>Find Your Daily Meditation</Text>
        </View>
        <Text style={styles.stepDescription}>
          Open the <Text style={styles.stepHighlight}>Today</Text> tab and look for <Text style={styles.stepHighlight}>Today's Focus</Text>
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.demoTodayContainer,
          {
            opacity: demoOpacity,
            transform: [{ translateY: demoTranslateY }],
          },
        ]}
      >
        {/* Today's Focus Section */}
        <View style={styles.demoCard}>
          <View style={styles.demoCardHeader}>
            <Text style={styles.demoCardTitle}>🧘‍♀️ Today's Focus</Text>
            <View style={[styles.demoModuleBadge, { backgroundColor: selectedModule.color }]}>
              <Text style={styles.demoModuleBadgeText}>{selectedModule.title}</Text>
            </View>
          </View>
          
          <Text style={styles.demoFocusSubtitle}>
            Personalized for your {selectedModule.title.toLowerCase()} journey
          </Text>

          {/* Recommended Session Demo */}
          <View style={styles.demoRecommendedSessionWrapper}>
            <View style={[styles.demoRecommendedSession, { borderColor: selectedModule.color + '40' }]}>
              <StickerBadge
                text="Your personalized pick"
                delay={1000}
                isActive={isActive}
              />
              <View style={styles.demoSessionContent}>
              <Text style={styles.demoSessionTitle}>{demoRecommendedSession.title}</Text>
              <Text style={styles.demoSessionSubtitle}>
                {demoRecommendedSession.adaptiveReason}
              </Text>
              <View style={styles.demoSessionMetaContainer}>
                <Text style={styles.demoSessionMeta}>
                  {demoRecommendedSession.durationMin} min • {demoRecommendedSession.modality}
                </Text>
                <View style={styles.demoRecommendedBadge}>
                  <Text style={styles.demoRecommendedBadgeText}>Recommended</Text>
                </View>
              </View>
            </View>
            <View style={[styles.demoSessionPlayButton, { backgroundColor: selectedModule.color }]}>
              <Text style={styles.demoSessionPlayText}>▶</Text>
            </View>
            </View>
          </View>
        </View>

        {/* Step 2: Other Options */}
        <Animated.View
          style={[
            styles.stepContainer,
            { opacity: step2Opacity, marginTop: 24 },
          ]}
        >
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Not Feeling It? Try Other Options</Text>
          </View>
          <Text style={styles.stepDescription}>
            If the recommended session doesn't match your mood, scroll down to see <Text style={styles.stepHighlight}>Other Options</Text>
          </Text>
        </Animated.View>

        {/* Other Options Section */}
        <View style={styles.demoCard}>
          <View style={styles.demoCardHeader}>
            <Text style={styles.demoCardTitle}>💡 Other Options</Text>
          </View>
          
          <View style={styles.demoAlternativesList}>
            {demoAlternativeSessions.map((session, index) => (
              <View key={session.id} style={styles.demoAlternativeSessionWrapper}>
                <View style={styles.demoAlternativeSession}>
                  {index === 0 && (
                    <StickerBadge
                      text="Pick what feels right"
                      delay={1400}
                      isActive={isActive}
                      bottomOffset={-91}
                    />
                  )}
                  <View style={styles.demoAlternativeContent}>
                  <Text style={styles.demoAlternativeTitle}>{session.title}</Text>
                  <Text style={styles.demoAlternativeMeta}>
                    {session.durationMin} min • {session.modality}
                  </Text>
                </View>
                <View style={styles.demoAlternativePlayButton}>
                  <Text style={styles.demoAlternativePlayText}>▶</Text>
                </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Step 3: How We Tailor */}
        <Animated.View
          style={[
            styles.stepContainer,
            { opacity: step3Opacity, marginTop: 24 },
          ]}
        >
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>We Learn What Works for You</Text>
          </View>
          <Text style={styles.stepDescription}>
            After you complete a session, <Text style={styles.stepHighlight}>rate</Text> how effective it was. Your feedback helps us find the perfect meditation for your goal.
          </Text>
        </Animated.View>

        {/* Feedback Card */}
        <View style={styles.demoExplanationCard}>
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackCardTitle}>How was this meditation?</Text>
            <Text style={styles.feedbackCardSubtitle}>Slide to rate your experience.</Text>
            <View style={styles.feedbackSliderWrapper}>
              <View style={styles.feedbackSliderContainer} pointerEvents="none">
                <Slider0to10
                  value={feedbackRating}
                  onValueChange={() => {}} // Disabled for demo
                  showLabels={false}
                  variant="bar"
                />
                <View style={styles.feedbackSliderLabelsRow}>
                  <Text style={[styles.feedbackSliderLabel, styles.feedbackSliderLabelLeft]}>Not great</Text>
                  <Text style={[styles.feedbackSliderLabel, styles.feedbackSliderLabelCenter]}>Neutral</Text>
                  <Text style={[styles.feedbackSliderLabel, styles.feedbackSliderLabelRight]}>Very good</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
      </View>
      </ScrollView>
      
      {/* Scroll Indicator */}
      {showScrollArrow && (
        <Animated.View 
          style={[
            styles.scrollArrowContainer,
            { opacity: arrowOpacity }
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={['rgba(242, 242, 247, 0)', 'rgba(242, 242, 247, 0.4)', 'rgba(242, 242, 247, 0.8)', 'rgba(242, 242, 247, 1)']}
            locations={[0, 0.3, 0.7, 1]}
            style={styles.scrollArrowGradient}
          >
            <View style={styles.scrollArrow}>
              <Text style={styles.scrollArrowText}>⌄</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      )}
    </View>
  );
};

// Login Page Component
const LoginPage: React.FC<{ 
  isActive: boolean;
  onLogin: () => void;
  onNavigateToPremium: () => void;
}> = ({ isActive, onLogin, onNavigateToPremium }) => {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(30)).current;
  const hasAnimated = useRef(false);
  const [typingText, setTypingText] = useState('');
  const [showCursor, setShowCursor] = useState(false);
  const typingComplete = useRef(false);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cursorHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  const [isLoadingGoogleSignIn, setIsLoadingGoogleSignIn] = useState(false);
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const spinnerRotation = useRef(new Animated.Value(0)).current;
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHealthDataModal, setShowHealthDataModal] = useState(false);
  
  const fullText = "Time to get started on your journey.";

  // Complete the OAuth session when the browser closes
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  // Spinner rotation animation
  useEffect(() => {
    if (isLoadingGoogleSignIn) {
      const rotateAnimation = Animated.loop(
        Animated.timing(spinnerRotation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      return () => rotateAnimation.stop();
    } else {
      spinnerRotation.setValue(0);
    }
  }, [isLoadingGoogleSignIn]);
  
  const spinnerInterpolate = spinnerRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  // Blinking cursor animation
  useEffect(() => {
    if (isActive && showCursor) {
      const blinkAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(cursorOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      blinkAnimation.start();
      return () => {
        blinkAnimation.stop();
        cursorOpacity.setValue(1);
      };
    }
  }, [isActive, showCursor]);

  useEffect(() => {
    if (isActive && !hasAnimated.current) {
      hasAnimated.current = true;
      // Reset typing state
      setTypingText('');
      typingComplete.current = false;
      
      // Animate title
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 600,
          delay: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      // Start typing animation after title appears
      typingTimeoutRef.current = setTimeout(() => {
        setShowCursor(true);
        let currentIndex = 0;
        typingIntervalRef.current = setInterval(() => {
          if (currentIndex < fullText.length) {
            setTypingText(fullText.substring(0, currentIndex + 1));
            currentIndex++;
          } else {
            if (typingIntervalRef.current) {
              clearInterval(typingIntervalRef.current);
              typingIntervalRef.current = null;
            }
            typingComplete.current = true;
            // Hide cursor after a short delay
            cursorHideTimeoutRef.current = setTimeout(() => {
              setShowCursor(false);
            }, 800); // Hide cursor 800ms after typing completes
          }
        }, 50); // 50ms per character for smooth typing
      }, 800);

      // Animate buttons sliding up
      Animated.parallel([
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 600,
          delay: 500,
          useNativeDriver: true,
        }),
        Animated.spring(buttonsTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          delay: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!isActive) {
      // Reset when page becomes inactive
      hasAnimated.current = false;
      setTypingText('');
      setShowCursor(false);
      typingComplete.current = false;
    }
    
    return () => {
      // Cleanup on unmount or when isActive changes
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      if (cursorHideTimeoutRef.current) {
        clearTimeout(cursorHideTimeoutRef.current);
        cursorHideTimeoutRef.current = null;
      }
    };
  }, [isActive, fullText]);

  const handleGoogleSignIn = async () => {
    try {
      console.log('🔵 Starting Google sign in...');
      
      const result = await signInWithGoogle(() => {
        // Callback fires immediately when browser closes (before token processing)
        console.log('🔵 Browser closed callback fired - showing loading immediately');
        setIsLoadingGoogleSignIn(true);
        Animated.timing(loadingOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
      
      if (result.success && result.userId) {
        // Session was created immediately during signInWithGoogle
        console.log('✅ Google sign in completed immediately, creating user profile...');
        
        // CRITICAL: Wait for user profile creation before navigating
        try {
          // Get session to get user email and metadata
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            console.error('❌ [Onboarding] No session found after sign in');
            setIsLoadingGoogleSignIn(false);
            Animated.timing(loadingOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
            showErrorAlert(ERROR_TITLES.AUTHENTICATION_FAILED, 'Session not found after sign in. Please try again.');
            return;
          }
          
          const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
          const firstName = fullName?.trim() ? fullName.trim().split(' ')[0] : undefined;
          
          console.log('🔵 [Onboarding] Creating user profile immediately with:', {
            userId: result.userId,
            email: session.user.email || '',
            firstName,
          });
          
          // Wait for profile creation to complete (has 15-second timeout)
          const profileResult = await createUserProfile(
            result.userId,
            session.user.email || '',
            firstName
          );
          
          if (!profileResult.success) {
            console.error('❌ [Onboarding] Failed to create user profile:', profileResult.error);
            setIsLoadingGoogleSignIn(false);
            Animated.timing(loadingOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
            showErrorAlert(
              ERROR_TITLES.AUTHENTICATION_FAILED,
              `Failed to create user profile: ${profileResult.error || 'Unknown error'}. Please try again.`
            );
            return;
          }
          
          console.log('✅ [Onboarding] User profile created successfully, verifying...');
          
          // Double-check that user exists in database before navigating
          const userProfile = await getUserProfile(result.userId);
          if (!userProfile) {
            console.error('❌ [Onboarding] User profile not found in database after creation');
            setIsLoadingGoogleSignIn(false);
            Animated.timing(loadingOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
            showErrorAlert(
              ERROR_TITLES.AUTHENTICATION_FAILED,
              'User profile was not created successfully. Please try again.'
            );
            return;
          }
          
          console.log('✅ [Onboarding] User profile verified in database');
          
          // Check premium status from database after profile creation
          if (userProfile.subscription_type) {
            const setSubscriptionType = useStore.getState().setSubscriptionType;
            setSubscriptionType(userProfile.subscription_type);
            console.log('✅ [Onboarding] Updated subscription type from database:', userProfile.subscription_type);
          }
          
          // Only navigate after user profile is confirmed to exist
          setIsLoadingGoogleSignIn(false);
          Animated.timing(loadingOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onNavigateToPremium();
          });
        } catch (profileError: any) {
          console.error('❌ [Onboarding] Error creating user profile:', profileError);
          setIsLoadingGoogleSignIn(false);
          Animated.timing(loadingOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
          showErrorAlert(
            ERROR_TITLES.AUTHENTICATION_FAILED,
            `Error creating user profile: ${profileError?.message || 'Unknown error'}. Please try again.`
          );
        }
      } else if (result.success) {
        // Browser closed but processing still happening - loading should already be showing
        console.log('🔵 Browser closed, processing tokens...');
        
        let authCompleted = false;
        let authErrorOccurred = false;
        let subscription: { unsubscribe: () => void } | null = null;
        
        // Check session immediately in case it was already set
        const checkSessionImmediately = async () => {
          try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (session?.user && !authCompleted) {
              console.log('✅ Session found immediately after OAuth, creating user profile...');
              const userId = session.user.id;
              
              // CRITICAL: Wait for user profile creation before navigating
              try {
                const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
                const firstName = fullName?.trim() ? fullName.trim().split(' ')[0] : undefined;
                
                console.log('🔵 [Onboarding] Creating user profile in checkSessionImmediately with:', {
                  userId,
                  email: session.user.email || '',
                  firstName,
                });
                
                // Wait for profile creation to complete (has 15-second timeout)
                const profileResult = await createUserProfile(
                  userId,
                  session.user.email || '',
                  firstName
                );
                
                if (!profileResult.success) {
                  console.error('❌ [Onboarding] Failed to create user profile:', profileResult.error);
                  authErrorOccurred = true;
                  authCompleted = true;
                  setIsLoadingGoogleSignIn(false);
                  Animated.timing(loadingOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                  }).start();
                  if (subscription) subscription.unsubscribe();
                  showErrorAlert(
                    ERROR_TITLES.AUTHENTICATION_FAILED,
                    `Failed to create user profile: ${profileResult.error || 'Unknown error'}. Please try again.`
                  );
                  return false;
                }
                
                console.log('✅ [Onboarding] User profile created successfully in checkSessionImmediately, verifying...');
                
                // Double-check that user exists in database before navigating
                const userProfile = await getUserProfile(userId);
                if (!userProfile) {
                  console.error('❌ [Onboarding] User profile not found in database after creation');
                  authErrorOccurred = true;
                  authCompleted = true;
                  setIsLoadingGoogleSignIn(false);
                  Animated.timing(loadingOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                  }).start();
                  if (subscription) subscription.unsubscribe();
                  showErrorAlert(
                    ERROR_TITLES.AUTHENTICATION_FAILED,
                    'User profile was not created successfully. Please try again.'
                  );
                  return false;
                }
                
                console.log('✅ [Onboarding] User profile verified in database');
                
                // Check premium status from database after profile creation
                if (userProfile.subscription_type) {
                  const setSubscriptionType = useStore.getState().setSubscriptionType;
                  setSubscriptionType(userProfile.subscription_type);
                  console.log('✅ [Onboarding] Updated subscription type from database:', userProfile.subscription_type);
                }
                
                authCompleted = true;
                // Only navigate after user profile is confirmed to exist
                setIsLoadingGoogleSignIn(false);
                Animated.timing(loadingOpacity, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start(() => {
                  if (subscription) subscription.unsubscribe();
                  onNavigateToPremium();
                });
                return true;
              } catch (profileError: any) {
                console.error('❌ [Onboarding] Error creating user profile:', profileError);
                authErrorOccurred = true;
                authCompleted = true;
                setIsLoadingGoogleSignIn(false);
                Animated.timing(loadingOpacity, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start();
                if (subscription) subscription.unsubscribe();
                showErrorAlert(
                  ERROR_TITLES.AUTHENTICATION_FAILED,
                  `Error creating user profile: ${profileError?.message || 'Unknown error'}. Please try again.`
                );
                return false;
              }
            }
            return false;
          } catch (error) {
            console.error('❌ Error checking session:', error);
            return false;
          }
        };
        
        // Set up listener for auth state changes FIRST (before checking session)
        // This ensures we catch the SIGNED_IN event even if it fires immediately
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            try {
              console.log('🔵 [Onboarding] Auth state changed:', event, session?.user?.id);
              
              // Handle errors from auth state change
              if (event === 'SIGNED_OUT' && !authCompleted) {
                console.error('❌ User was signed out during authentication');
                authErrorOccurred = true;
                authCompleted = true;
                setIsLoadingGoogleSignIn(false);
                Animated.timing(loadingOpacity, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start();
                if (subscription) subscription.unsubscribe();
                showErrorAlert(ERROR_TITLES.AUTHENTICATION_FAILED, 'Authentication was interrupted. Please try again.');
                return;
              }
              
              // Handle token refresh errors
              if (event === 'TOKEN_REFRESHED' && !session) {
                console.error('❌ Token refresh failed - no session');
                authErrorOccurred = true;
                authCompleted = true;
                setIsLoadingGoogleSignIn(false);
                Animated.timing(loadingOpacity, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start();
                if (subscription) subscription.unsubscribe();
                showErrorAlert(ERROR_TITLES.AUTHENTICATION_FAILED, 'Session expired. Please sign in again.');
                return;
              }
              
              if (event === 'SIGNED_IN' && session?.user) {
                console.log('✅ [Onboarding] Google sign in successful! Creating user profile...');
                const userId = session.user.id;
                
                // CRITICAL: Wait for user profile creation before navigating
                try {
                  const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
                  const firstName = fullName?.trim() ? fullName.trim().split(' ')[0] : undefined;
                  
                  console.log('🔵 [Onboarding] Creating user profile with:', {
                    userId,
                    email: session.user.email || '',
                    firstName,
                  });
                  
                  // Wait for profile creation to complete (has 15-second timeout)
                  const profileResult = await createUserProfile(
                    userId,
                    session.user.email || '',
                    firstName
                  );
                  
                  if (!profileResult.success) {
                    console.error('❌ [Onboarding] Failed to create user profile:', profileResult.error);
                    authErrorOccurred = true;
                    authCompleted = true;
                    setIsLoadingGoogleSignIn(false);
                    Animated.timing(loadingOpacity, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: true,
                    }).start();
                    if (subscription) subscription.unsubscribe();
                    showErrorAlert(
                      ERROR_TITLES.AUTHENTICATION_FAILED,
                      `Failed to create user profile: ${profileResult.error || 'Unknown error'}. Please try again.`
                    );
                    return;
                  }
                  
                  console.log('✅ [Onboarding] User profile created successfully, verifying...');
                  
                  // Double-check that user exists in database before navigating
                  const userProfile = await getUserProfile(userId);
                  if (!userProfile) {
                    console.error('❌ [Onboarding] User profile not found in database after creation');
                    authErrorOccurred = true;
                    authCompleted = true;
                    setIsLoadingGoogleSignIn(false);
                    Animated.timing(loadingOpacity, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: true,
                    }).start();
                    if (subscription) subscription.unsubscribe();
                    showErrorAlert(
                      ERROR_TITLES.AUTHENTICATION_FAILED,
                      'User profile was not created successfully. Please try again.'
                    );
                    return;
                  }
                  
                  console.log('✅ [Onboarding] User profile verified in database');
                  
                  // Check premium status from database after profile creation
                  if (userProfile.subscription_type) {
                    const setSubscriptionType = useStore.getState().setSubscriptionType;
                    setSubscriptionType(userProfile.subscription_type);
                    console.log('✅ [Onboarding] Updated subscription type from database:', userProfile.subscription_type);
                  }
                  
                  authCompleted = true;
                  // Only navigate after user profile is confirmed to exist
                  setIsLoadingGoogleSignIn(false);
                  Animated.timing(loadingOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                  }).start(() => {
                    if (subscription) subscription.unsubscribe();
                    onNavigateToPremium();
                  });
                } catch (profileError: any) {
                  console.error('❌ [Onboarding] Error creating user profile:', profileError);
                  authErrorOccurred = true;
                  authCompleted = true;
                  setIsLoadingGoogleSignIn(false);
                  Animated.timing(loadingOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                  }).start();
                  if (subscription) subscription.unsubscribe();
                  showErrorAlert(
                    ERROR_TITLES.AUTHENTICATION_FAILED,
                    `Error creating user profile: ${profileError?.message || 'Unknown error'}. Please try again.`
                  );
                }
              } else if (event === 'SIGNED_IN' && !session?.user) {
                console.error('❌ SIGNED_IN event but no user in session');
                authErrorOccurred = true;
                authCompleted = true;
                setIsLoadingGoogleSignIn(false);
                Animated.timing(loadingOpacity, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start();
                if (subscription) subscription.unsubscribe();
                showErrorAlert(ERROR_TITLES.AUTHENTICATION_FAILED, 'Authentication completed but user data is missing. Please try again.');
              }
            } catch (error: any) {
              console.error('❌ Error in auth state change handler:', error);
              authErrorOccurred = true;
              authCompleted = true;
              setIsLoadingGoogleSignIn(false);
              Animated.timing(loadingOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start();
              if (subscription) subscription.unsubscribe();
              showErrorAlert(ERROR_TITLES.AUTHENTICATION_FAILED, error);
            }
          }
        );
        subscription = authSubscription;
        
        // Check session immediately AFTER setting up listener (in case it was already set)
        setTimeout(async () => {
          if (!authCompleted && !authErrorOccurred) {
            const found = await checkSessionImmediately();
            if (found) {
              // Already handled in checkSessionImmediately
            }
          }
        }, 500); // Check after 500ms
        
        // Poll for session more aggressively at first, then slow down
        let pollAttempts = 0;
        const pollInterval = setInterval(async () => {
          if (authCompleted || authErrorOccurred) {
            clearInterval(pollInterval);
            return;
          }
          
          pollAttempts++;
          const found = await checkSessionImmediately();
          if (found) {
            clearInterval(pollInterval);
          } else if (pollAttempts > 30) {
            // Stop polling after 30 seconds
            clearInterval(pollInterval);
            console.warn('⚠️ [Onboarding] Stopped polling after 30 seconds, session may not be available');
          }
        }, 500); // Check every 500ms for faster detection
        
        // Timeout after 60 seconds if auth doesn't complete
        setTimeout(() => {
          clearInterval(pollInterval);
          if (subscription) subscription.unsubscribe();
          if (!authCompleted) {
            console.error('❌ Google sign in timed out');
            setIsLoadingGoogleSignIn(false);
            Animated.timing(loadingOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
            showErrorAlert(ERROR_TITLES.AUTHENTICATION_FAILED, 'Sign in timed out. Please try again.');
          }
        }, 60000);
      } else {
        console.error('❌ Google sign in failed:', result.error);
        setIsLoadingGoogleSignIn(false);
        Animated.timing(loadingOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
        // Show error for all failures
        const errorMessage = result.error || 'Failed to sign in with Google';
        showErrorAlert(ERROR_TITLES.AUTHENTICATION_FAILED, errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Google sign in error:', error);
      setIsLoadingGoogleSignIn(false);
      Animated.timing(loadingOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      showErrorAlert(ERROR_TITLES.AUTHENTICATION_FAILED, error);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      if (Platform.OS !== 'ios') {
        showErrorAlert(ERROR_TITLES.NOT_AVAILABLE, 'Apple Sign In is only available on iOS');
        return;
      }
      
      const result = await signInWithApple();
      if (result.success && result.userId) {
        // Auth state listener in App.tsx will handle setting userId
        // Add a small delay to ensure smooth navigation and animation
        setTimeout(() => {
          onNavigateToPremium();
        }, 300);
      } else {
        // Show error for all failures
        const errorMessage = result.error || 'Failed to sign in with Apple';
        showErrorAlert(ERROR_TITLES.AUTHENTICATION_FAILED, errorMessage);
      }
    } catch (error: any) {
      console.error('Apple sign in error:', error);
      showErrorAlert(ERROR_TITLES.AUTHENTICATION_FAILED, error);
    }
  };

  // Calculate responsive font size for "That's everything" text
  // Find the maximum font size that fits without getting cut off
  const calculateResponsiveFontSize = () => {
    const baseFontSize = 46;
    const referenceWidth = 375; // iPhone standard width
    const minFontSize = 28; // Minimum readable size
    const maxFontSize = 46; // Maximum size (current)
    
    // Account for horizontal padding: 20px on each side + 8px paddingLeft = 48px total
    const availableWidth = SCREEN_WIDTH - 38;
    
    // Estimate text width: "That's everything." is ~18 characters
    // Approximate character width ratio: fontSize * 0.50 (balanced ratio for bold text)
    // Calculate maximum font size that fits: availableWidth >= fontSize * charWidthRatio * textLength
    const textLength = 18; // "That's everything."
    const charWidthRatio = 0.48; // Balanced ratio for bold text, slightly larger
    
    // Calculate maximum font size that fits exactly (this is the maximum that will fit)
    const maxFittingSize = availableWidth / (charWidthRatio * textLength);
    
    // Also scale based on width ratio for consistency on larger screens
    const widthRatio = availableWidth / referenceWidth;
    const ratioBasedSize = baseFontSize * widthRatio;
    
    // Use the smaller of the two to ensure it fits, prioritizing maxFittingSize for accuracy
    const calculatedSize = Math.min(maxFittingSize, ratioBasedSize);
    
    // Clamp between min and max, but allow it to be as large as possible
    return Math.max(minFontSize, Math.min(maxFontSize, calculatedSize));
  };

  const responsiveFontSize = calculateResponsiveFontSize();
  // Calculate proportional lineHeight (base lineHeight is 56 for fontSize 46, ratio ~1.22)
  const responsiveLineHeight = responsiveFontSize * 1.22;

  return (
    <View style={styles.loginPage}>
      <View style={styles.loginBackground}>
        {/* Large background text */}
        <Animated.View
          style={[
            styles.loginBackgroundTextContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={[styles.loginBackgroundTextLarge, { fontSize: responsiveFontSize, lineHeight: responsiveLineHeight }]} numberOfLines={1}>That's everything.</Text>
          <Text style={styles.loginBackgroundTextSmall}>
            {typingText}
            {showCursor && (
              <Animated.Text style={[styles.typingCursor, { opacity: cursorOpacity }]}>|</Animated.Text>
            )}
          </Text>
        </Animated.View>

        {/* Social Login Buttons - Positioned at bottom */}
        <View style={styles.loginButtonsWrapper}>
          <Animated.View
            style={[
              styles.loginButtonsBox,
              {
                opacity: buttonsOpacity,
                transform: [{ translateY: buttonsTranslateY }],
              },
            ]}
          >
            {/* Subtitle inside box */}
            <Text style={styles.loginBoxSubtitle}>Create an account to save your progress and personalize your experience</Text>

            {/* Terms of Service Checkbox */}
            <View style={styles.termsContainer}>
              <TouchableOpacity 
                style={styles.checkboxWrapper}
                onPress={() => setTermsAccepted(!termsAccepted)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                  {termsAccepted && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>
                  By clicking this box, you accept our{' '}
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowTermsModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.termsLink}>Terms of Service</Text>
                </TouchableOpacity>
                <Text style={styles.termsText}> and </Text>
                <TouchableOpacity 
                  onPress={() => setShowPrivacyModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </TouchableOpacity>
                <Text style={styles.termsText}>, and </Text>
                <TouchableOpacity 
                  onPress={() => setShowHealthDataModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.termsLink}>Consumer Health Data Privacy</Text>
                </TouchableOpacity>
                <Text style={styles.termsText}>.</Text>
              </View>
            </View>

            {/* Google Sign In Button */}
            <TouchableOpacity 
              style={[styles.socialButton, !termsAccepted && styles.socialButtonDisabled]}
              onPress={handleGoogleSignIn}
              activeOpacity={0.7}
              disabled={!termsAccepted}
            >
              <View style={styles.socialButtonContent}>
                <View style={styles.googleIconContainer}>
                  <Svg width={20} height={20} viewBox="0 0 24 24">
                    <Path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <Path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <Path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <Path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </Svg>
                </View>
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </View>
            </TouchableOpacity>

            {/* Apple Sign In Button - iOS only */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity 
                style={[styles.socialButton, styles.appleButton, !termsAccepted && styles.socialButtonDisabled]}
                onPress={handleAppleSignIn}
                activeOpacity={0.7}
                disabled={!termsAccepted}
              >
                <View style={styles.socialButtonContent}>
                  <View style={styles.appleIconContainer}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="#ffffff">
                      <Path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C1.79 15.25 4.23 7.59 9.2 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </Svg>
                  </View>
                  <Text style={[styles.socialButtonText, styles.appleButtonText]}>Continue with Apple</Text>
                </View>
              </TouchableOpacity>
            )}

          </Animated.View>
        </View>
      </View>

      {/* Loading Modal for Google Sign In */}
      <Modal
        visible={isLoadingGoogleSignIn}
        transparent={true}
        animationType="none"
        onRequestClose={() => {}}
      >
        <Animated.View
          style={[
            styles.loadingOverlay,
            { opacity: loadingOpacity }
          ]}
        >
          <View style={styles.loadingContent}>
            <View style={styles.loadingSpinnerContainer}>
              <Animated.View 
                style={[
                  styles.loadingSpinner,
                  { transform: [{ rotate: spinnerInterpolate }] }
                ]}
              />
            </View>
            <Text style={styles.loadingText}>Signing in with Google...</Text>
            <Text style={styles.loadingSubtext}>Please wait</Text>
          </View>
        </Animated.View>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <TermsOfServiceScreen onClose={() => setShowTermsModal(false)} />
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <PrivacyPolicyScreen onClose={() => setShowPrivacyModal(false)} />
      </Modal>

      {/* Consumer Health Data Privacy Modal */}
      <Modal
        visible={showHealthDataModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHealthDataModal(false)}
      >
        <ConsumerHealthDataPrivacyScreen onClose={() => setShowHealthDataModal(false)} />
      </Modal>
    </View>
  );
};

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.95)).current;
  const setTodayModuleId = useStore(state => state.setTodayModuleId);
  const userId = useStore(state => state.userId);
  const subscriptionType = useStore(state => state.subscriptionType);
  const setSubscriptionType = useStore(state => state.setSubscriptionType);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [demoModuleId, setDemoModuleId] = useState<string | null>(null);
  const previousDemoModuleId = useRef<string | null>(null);
  const [hasClickedChangeButton, setHasClickedChangeButton] = useState(false);
  const [hasScrolledOnHowToUse, setHasScrolledOnHowToUse] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [congratulationsModule, setCongratulationsModule] = useState<{ title: string; color: string } | null>(null);
  const onCongratulationsCompleteRef = useRef<(() => void) | null>(null);
  const [showFinishAnimation, setShowFinishAnimation] = useState(false);
  const finishOverlayOpacity = useRef(new Animated.Value(0)).current;
  const finishOverlayScale = useRef(new Animated.Value(1)).current;
  const finishContentOpacity = useRef(new Animated.Value(0)).current;
  const finishContentScale = useRef(new Animated.Value(0.8)).current;
  const hasCheckedSubscription = useRef(false);

  const TOTAL_PAGES = 7;

  // Check subscription type when user signs in
  useEffect(() => {
    const checkSubscriptionType = async () => {
      if (userId && !hasCheckedSubscription.current) {
        hasCheckedSubscription.current = true;
        try {
          const isPremium = await isPremiumUser(userId);
          const subscriptionType = isPremium ? 'premium' : 'basic';
          setSubscriptionType(subscriptionType);
          console.log('✅ [Onboarding] Loaded subscription type:', subscriptionType, '(validated)');
          
          // If user has premium, skip payment page
          if (isPremium) {
            console.log('✅ [Onboarding] User has premium, will skip payment page');
          }
        } catch (error) {
          console.error('❌ [Onboarding] Error checking subscription type:', error);
        }
      }
    };
    
    checkSubscriptionType();
  }, [userId, setSubscriptionType]);

  useEffect(() => {
    if (currentPage === 0) {
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
    } else {
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    // Reset change button click state when leaving page 2
    if (currentPage !== 2) {
      setHasClickedChangeButton(false);
    }
    // Reset scroll state when leaving page 3
    if (currentPage !== 3) {
      setHasScrolledOnHowToUse(false);
    }
    
    // Auto-skip premium and payment pages if user already has premium (check from database)
    if (currentPage === 5 && userId) {
      let skipTimer: NodeJS.Timeout | null = null;
      let cancelled = false;
      
      // Validate premium status directly from database
      isPremiumUser(userId).then((isPremium) => {
        if (cancelled) return;
        
        if (isPremium) {
          console.log('✅ [Onboarding] User has premium from database, auto-skipping premium page');
          // Update store with validated premium status
          setSubscriptionType('premium');
          // Small delay to allow page to render, then finish
          skipTimer = setTimeout(() => {
            if (cancelled) return;
            finishOverlayOpacity.setValue(1);
            setShowFinishAnimation(true);
            setTimeout(() => {
              Animated.parallel([
                Animated.timing(finishContentOpacity, {
                  toValue: 1,
                  duration: 400,
                  easing: Easing.out(Easing.ease),
                  useNativeDriver: true,
                }),
                Animated.spring(finishContentScale, {
                  toValue: 1,
                  tension: 40,
                  friction: 7,
                  useNativeDriver: true,
                }),
              ]).start(() => {
                setTimeout(() => {
                  if (!cancelled) {
                    onFinish();
                  }
                }, 2000);
              });
            }, 100);
          }, 100);
        }
      }).catch((error) => {
        if (!cancelled) {
          console.error('❌ [Onboarding] Error checking premium status from database:', error);
        }
      });
      
      return () => {
        cancelled = true;
        if (skipTimer) {
          clearTimeout(skipTimer);
        }
      };
    }
  }, [currentPage, userId, setSubscriptionType, finishOverlayOpacity, finishContentOpacity, finishContentScale, onFinish]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPage(page);
  };

  const handleNext = async () => {
    // If on premium page (page 5)
    if (currentPage === 5) {
      // Check premium status directly from database, not from store
      if (userId) {
        try {
          const userProfile = await getUserProfile(userId);
          if (userProfile?.subscription_type === 'premium') {
            console.log('✅ [Onboarding] User has premium from database, skipping payment page');
            // Update store with database value
            setSubscriptionType('premium');
            handleFinish();
            return;
          } else {
            // Update store with database value (should be 'basic')
            if (userProfile?.subscription_type) {
              setSubscriptionType(userProfile.subscription_type);
            }
          }
        } catch (error) {
          console.error('❌ [Onboarding] Error checking premium status from database:', error);
          // On error, continue with normal flow
        }
      }
      
      // If plan is selected, go to payment page
      if (selectedPlan) {
        scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH * 6, animated: true });
      } else {
        // If on premium page with no plan selected, skip to finish
        handleFinish();
      }
    } else if (currentPage < TOTAL_PAGES - 1) {
      scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH * (currentPage + 1), animated: true });
    } else {
      handleFinish();
    }
  };

  const handleFinish = (skipped: boolean = false) => {
    // Set subscription type based on whether a plan was selected
    const setSubscriptionType = useStore.getState().setSubscriptionType;
    // If skipped is true, treat as free plan regardless of selectedPlan
    if (selectedPlan && !skipped) {
      // User selected a plan and completed payment
      setSubscriptionType('premium');
    } else {
      // User skipped payment or selected free plan
      setSubscriptionType('basic');
    }
    
    // Start smooth exit animation - immediately show overlay to hide content
    finishOverlayOpacity.setValue(1); // Set to fully opaque immediately to hide premium page
    setShowFinishAnimation(true);
    
    // Small delay then show content animation
    setTimeout(() => {
      // Show finish content
      Animated.parallel([
        Animated.timing(finishContentOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(finishContentScale, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // After showing content, fade everything out and finish
        setTimeout(() => {
          // Fade out content but keep overlay visible
          Animated.parallel([
            Animated.timing(finishContentOpacity, {
              toValue: 0,
              duration: 500,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(finishContentScale, {
              toValue: 1.2,
              duration: 500,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]).start(() => {
            // Complete onboarding while overlay is still visible
            if (selectedModule) {
              setTodayModuleId(selectedModule);
            }
            useStore.setState({ 
              hasCompletedOnboarding: true,
              isLoggedIn: true 
            });
            // Keep overlay visible and transition directly to app
            // Pass skipped flag to onFinish callback
            onFinish(skipped);
          });
        }, 800); // Show content for 800ms before fading out
      });
    }, 100); // Small delay before showing content
  };

  const handleSkip = () => {
    handleFinish(true); // Pass true to indicate skip was pressed
  };

  const handleSelectModule = (moduleId: string) => {
    setSelectedModule(moduleId);
  };

  const handleDemoModuleChange = (moduleId: string) => {
    // Track previous module before updating
    previousDemoModuleId.current = demoModuleId || selectedModule || 'anxiety';
    setDemoModuleId(moduleId);
    setSelectedModule(moduleId);
  };

  const handleModuleChanged = () => {
    // No automatic transition - user stays on current page
    // This function is kept for potential future use but does nothing
  };

  const handleLogin = () => {
    handleFinish();
  };

  const getButtonText = () => {
    if (currentPage === 0) return 'Continue';
    if (currentPage === 1) return selectedModule ? 'Continue' : 'Select a module';
    if (currentPage === 2) return hasClickedChangeButton ? 'Continue' : 'Click the change button';
    if (currentPage === 3) return hasScrolledOnHowToUse ? 'Continue' : 'Scroll down';
    if (currentPage === 5) {
      return selectedPlan ? 'Continue to payment' : "No thanks! I'll continue with Free Plan.";
    }
    if (currentPage === 6) return 'Complete Purchase';
    return 'Continue';
  };

  const canProceed = () => {
    if (currentPage === 1 && !selectedModule) return false;
    if (currentPage === 2 && !hasClickedChangeButton) return false;
    if (currentPage === 3 && !hasScrolledOnHowToUse) return false;
    return true;
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f2f2f7" />
      <View style={styles.container}>
        {!showFinishAnimation && currentPage === 0 && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}

        {!showFinishAnimation && (
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.scrollView}
            scrollEnabled={false}
          >
          <WelcomePage />
          <SelectModulePage 
            selectedModule={selectedModule}
            onSelectModule={handleSelectModule}
            isActive={currentPage === 1}
          />
          <ChangeButtonDemoPage 
            selectedModule={demoModuleId || selectedModule || 'anxiety'}
            isActive={currentPage === 2}
            onModuleChange={handleDemoModuleChange}
            onShowModal={() => {
              setShowModuleModal(true);
              // Activate continue button after 100ms delay
              setTimeout(() => {
                setHasClickedChangeButton(true);
              }, 100);
            }}
            previousModuleId={previousDemoModuleId.current}
            onShowCongratulations={(show) => {
              setShowCongratulations(show);
              if (show) {
                const module = mentalHealthModules.find(m => m.id === (demoModuleId || selectedModule || 'anxiety'));
                if (module) {
                  setCongratulationsModule({ title: module.title, color: module.color });
                }
              }
            }}
            onCongratulationsComplete={(handler) => {
              onCongratulationsCompleteRef.current = handler;
            }}
          />
          <HowToUsePage 
            isActive={currentPage === 3}
            onScrollStateChange={(hasScrolled) => {
              if (currentPage === 3) {
                setHasScrolledOnHowToUse(hasScrolled);
              }
            }}
          />
          <LoginPage 
            isActive={currentPage === 4}
            onLogin={handleLogin}
            onNavigateToPremium={async () => {
              // Validate premium status directly from database, not from store
              if (userId) {
                try {
                  const isPremium = await isPremiumUser(userId);
                  if (isPremium) {
                    console.log('✅ [Onboarding] User has premium from database, skipping premium and payment pages');
                    // Update store with validated premium status
                    setSubscriptionType('premium');
                    handleFinish();
                    return;
                  } else {
                    // Update store with validated basic status
                    setSubscriptionType('basic');
                    console.log('✅ [Onboarding] User subscription from database: basic (validated)');
                  }
                } catch (error) {
                  console.error('❌ [Onboarding] Error checking subscription from database:', error);
                  // On error, don't skip - let user go through premium flow
                }
              }
              // Navigate to premium features page (page 5)
              scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH * 5, animated: true });
            }}
          />
          <PremiumFeaturesPage 
            isActive={currentPage === 5}
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
            onClose={() => {
              // Clear selected plan and finish with basic subscription
              setSelectedPlan(null);
              handleFinish(true); // Pass true to indicate skip
            }}
            isOnboarding={true}
          />
          <PaymentPage
            isActive={currentPage === 6}
            selectedPlan={selectedPlan}
            onBack={() => {
              scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH * 5, animated: true });
            }}
            onComplete={handleFinish}
            isOnboarding={true}
          />
          </ScrollView>
        )}

        {!showFinishAnimation && currentPage !== 4 && currentPage !== 6 && (
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: buttonOpacity,
                transform: [{ scale: buttonScale }],
              },
            ]}
          >
            <TouchableOpacity 
              style={[styles.button, !canProceed() && styles.buttonDisabled]} 
              onPress={handleNext} 
              activeOpacity={0.7}
              disabled={!canProceed()}
            >
              <Text style={styles.buttonText}>{getButtonText()}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Congratulations Overlay - Rendered at root level to cover entire screen */}
      {showCongratulations && congratulationsModule && (
        <CongratulationsOverlay
          visible={showCongratulations}
          moduleTitle={congratulationsModule.title}
          moduleColor={congratulationsModule.color}
          onComplete={() => {
            setShowCongratulations(false);
            setCongratulationsModule(null);
            // Call the handler from ChangeButtonDemoPage to show instructional text
            if (onCongratulationsCompleteRef.current) {
              onCongratulationsCompleteRef.current();
            }
          }}
        />
      )}

      {/* Module Grid Modal */}
      {currentPage === 2 && (
        <ModuleGridModal
          modules={mentalHealthModules}
          selectedModuleId={demoModuleId || selectedModule || 'anxiety'}
          isVisible={showModuleModal}
          onModuleSelect={handleDemoModuleChange}
          onClose={() => setShowModuleModal(false)}
        />
      )}

      {/* Finish Animation Overlay - covers everything */}
      {showFinishAnimation && (
        <Animated.View
          style={[
            styles.finishOverlay,
            {
              opacity: finishOverlayOpacity,
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.finishOverlayBackground} />
          <Animated.View
            style={[
              styles.finishContent,
              {
                opacity: finishContentOpacity,
                transform: [{ scale: finishContentScale }],
              },
            ]}
          >
            <View style={styles.finishIconContainer}>
              <Image
                source={require('../../assets/icon_no_background.png')}
                style={styles.finishIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.finishText}>Welcome to Neurotype!</Text>
            <Text style={styles.finishSubtext}>Let's begin your journey</Text>
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.health.container.backgroundColor,
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  pageBackground: {
    flex: 1,
    width: '100%',
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 20,
    backgroundColor: theme.health.container.backgroundColor,
  },
  // Onboarding version - content near dynamic island, button in flow
  howToUsePageBackground: {
    flex: 1,
    width: '100%',
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 20,
    backgroundColor: theme.health.container.backgroundColor,
  },
  // Modal version - has header, button absolutely positioned
  howToUsePageBackgroundModal: {
    flex: 1,
    width: '100%',
    paddingTop: 0,
    paddingBottom: 120,
    paddingHorizontal: 20,
    backgroundColor: theme.health.container.backgroundColor,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#8e8e93',
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
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    ...theme.health.title,
    textAlign: 'center',
  },
  titleLight: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 40,
  },
  subtitle: {
    ...theme.health.subtitle,
    textAlign: 'center',
    marginTop: 4,
  },
  subtitleLight: {
    fontSize: 20,
    fontWeight: '400',
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 28,
  },
  featuresContainer: {
    flex: 1,
    paddingHorizontal: 0,
  },
  featurePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 32,
  },
  featureTextContainer: {
    flex: 1,
    paddingTop: 2,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  featureTitleLight: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 15,
    color: '#8e8e93',
    lineHeight: 20,
  },
  featureDescriptionLight: {
    fontSize: 15,
    color: '#8e8e93',
    lineHeight: 20,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#8e8e93',
    lineHeight: 18,
    textAlign: 'center',
  },
  modulesWrapper: {
    flex: 1,
    position: 'relative',
  },
  modulesScrollView: {
    flex: 1,
  },
  modulesContainer: {
    paddingHorizontal: 0,
    paddingBottom: 10,
  },
  scrollArrowContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  scrollArrowGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  scrollArrow: {
    width: 40,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArrowText: {
    fontSize: 24,
    color: 'rgba(0, 0, 0, 0.4)',
    fontWeight: '300',
  },
  moduleCard: {
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  moduleCardSelected: {
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  moduleCardContent: {
    padding: 16,
    position: 'relative',
  },
  moduleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  moduleTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  moduleTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginRight: 8,
  },
  moduleCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  moduleCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  moduleDescription: {
    fontSize: 15,
    color: '#8e8e93',
    lineHeight: 20,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: '50%',
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -14 }], // Half of height to center vertically
  },
  checkmark: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
  },
  demoContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingTop: 40,
    paddingBottom: 20,
  },
  demoModuleCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    width: '100%',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  demoModuleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  demoModuleTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginRight: 8,
  },
  demoModuleCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  demoModuleCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  demoModuleDescription: {
    fontSize: 17,
    color: '#8e8e93',
    lineHeight: 22,
  },
  arrowPointer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  arrowPointerText: {
    fontSize: 32,
    color: '#007AFF',
    fontWeight: '300',
  },
  demoChangeButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoChangeButtonBackground: {
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  demoChangeButtonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoChangeButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  demoChangeIconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  demoChangeTextContainer: {
    position: 'absolute',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoChangeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  stepsContainer: {
    flex: 1,
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: 8,
    marginLeft: 28,
  },
  arrow: {
    fontSize: 20,
    color: '#8e8e93',
  },
  loginPage: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  loginBackground: {
    flex: 1,
    width: '100%',
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 20,
    backgroundColor: '#f2f2f7',
  },
  loginBackgroundTextContainer: {
    position: 'absolute',
    top: 320,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 0,
  },
  loginBackgroundTextLarge: {
    fontSize: 46,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'left',
    lineHeight: 56,
    marginBottom: 16,
    paddingLeft: 8,
    flexShrink: 0,
  },
  loginBackgroundTextSmall: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'left',
    lineHeight: 48,
    paddingLeft: 8,
  },
  typingCursor: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000000',
    opacity: 1,
  },
  loginTitleContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 32,
  },
  loginTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 40,
  },
  loginSubtitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 28,
  },
  loginButtonsWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    zIndex: 1,
  },
  loginButtonsBox: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 0,
    borderTopWidth: 1,
    borderColor: '#e5e5ea',
    width: '100%',
    minHeight: '50%',
  },
  loginBoxSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  checkboxWrapper: {
    marginRight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#8e8e93',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  termsText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#666666',
    lineHeight: 18,
  },
  termsLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
  socialButton: {
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    minHeight: 56,
  },
  socialButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#e5e5ea',
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appleIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 280,
  },
  loadingSpinnerContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingSpinner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: '#007AFF',
    borderTopColor: 'transparent',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
  },
  socialButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
    marginBottom: 0,
  },
  appleButtonText: {
    color: '#ffffff',
  },
  signInLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signInLinkText: {
    fontSize: 15,
    color: '#666666',
  },
  signInLink: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  premiumFeaturesContainer: {
    flex: 1,
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#c7c7cc',
  },
  indicatorActive: {
    backgroundColor: '#007AFF',
    width: 24,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  button: {
    ...theme.health.button,
  },
  buttonDisabled: {
    backgroundColor: '#c7c7cc',
  },
  buttonText: {
    ...theme.health.buttonText,
  },
  congratulationsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10000,
    width: '100%',
    height: '100%',
  },
  confettiContainer: {
    position: 'absolute',
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  congratulationsCheckmarkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  congratulationsCheckmarkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  congratulationsCheckmarkText: {
    fontSize: 60,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  congratulationsMessage: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  congratulationsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  congratulationsSubtitle: {
    fontSize: 17,
    color: '#8e8e93',
    textAlign: 'center',
  },
  instructionTextContainer: {
    marginTop: 150,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    fontSize: 15,
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  howToUseScrollContent: {
    paddingBottom: 0,
  },
  scrollIndicatorContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  scrollIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollIndicatorText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  scrollIndicatorArrow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollIndicatorArrowText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '300',
  },
  demoTodayContainer: {
    flex: 1,
    paddingHorizontal: 0,
  },
  demoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  demoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  demoCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  demoModuleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  demoModuleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  demoFocusSubtitle: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
    marginBottom: 16,
  },
  demoRecommendedSessionWrapper: {
    position: 'relative',
    marginTop: 8,
  },
  demoRecommendedSession: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
    overflow: 'visible',
  },
  demoSessionContent: {
    flex: 1,
    marginRight: 16,
  },
  demoSessionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  demoSessionSubtitle: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  demoSessionMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  demoSessionMeta: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '400',
  },
  demoSessionPlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoSessionPlayText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  demoRecommendedBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  demoRecommendedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  demoAlternativesList: {
    paddingTop: 8,
  },
  demoAlternativeSessionWrapper: {
    position: 'relative',
    marginVertical: 4,
  },
  demoAlternativeSession: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f2f2f7',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
    overflow: 'visible',
  },
  demoAlternativeContent: {
    flex: 1,
    marginRight: 16,
  },
  demoAlternativeTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  demoAlternativeMeta: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '400',
  },
  demoAlternativePlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f2f2f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoAlternativePlayText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: 'bold',
    marginLeft: 1,
  },
  demoExplanationCard: {
    marginTop: 8,
    paddingHorizontal: 0,
  },
  stepContainer: {
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  stepDescription: {
    fontSize: 15,
    color: '#8e8e93',
    lineHeight: 22,
    marginLeft: 44,
  },
  stepHighlight: {
    fontWeight: '600',
    color: '#007AFF',
  },
  stickerBadge: {
    position: 'absolute',
    right: -30,
    zIndex: 100,
    marginBottom: -15,
  },
  stickerBadgeInner: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  stickerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#007AFF',
    lineHeight: 13,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  stickerShine: {
    position: 'absolute',
    top: 0,
    left: -50,
    width: 20,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ skewX: '-20deg' }],
  },
  feedbackCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  feedbackCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  feedbackCardSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8e8e93',
    textAlign: 'center',
    marginBottom: 24,
  },
  feedbackSliderWrapper: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  feedbackSliderContainer: {
    alignItems: 'stretch',
    gap: 8,
  },
  feedbackSliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  feedbackSliderLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  feedbackSliderLabelLeft: {
    textAlign: 'left',
  },
  feedbackSliderLabelRight: {
    textAlign: 'right',
  },
  feedbackSliderLabelCenter: {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: '600',
  },
  finishOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    elevation: 10000,
  },
  finishOverlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f2f2f7',
  },
  finishContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  finishIcon: {
    width: 120,
    height: 120,
  },
  finishText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  finishSubtext: {
    fontSize: 20,
    fontWeight: '400',
    color: '#8e8e93',
    textAlign: 'center',
  },
});
