import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, Animated, StatusBar, TouchableOpacity, ScrollView, Dimensions, TextInput, KeyboardAvoidingView, Platform, Easing } from 'react-native';
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

interface OnboardingScreenProps {
  onFinish: () => void;
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
  const disclaimerOpacity = useRef(new Animated.Value(0)).current;

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

    Animated.timing(disclaimerOpacity, {
      toValue: 1,
      duration: 600,
      delay: 1800,
      useNativeDriver: true,
    }).start();
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

        <Animated.View style={[styles.disclaimerContainer, { opacity: disclaimerOpacity }]}>
          <Text style={styles.disclaimerTextLight}>
            Your meditation data and progress are used to improve your personalized experience.
          </Text>
        </Animated.View>
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
const CongratulationsOverlay: React.FC<{
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
const ChangeButtonDemoPage: React.FC<{ 
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
const HowToUsePage: React.FC<{ 
  isActive: boolean;
  onScrollStateChange?: (hasScrolled: boolean) => void;
}> = ({ isActive, onScrollStateChange }) => {
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
  
  const fullText = "Time to get started on your journey.";

  // Complete the OAuth session when the browser closes
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);
  
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
      // Open OAuth URL in browser
      // TODO: Replace with your actual Google OAuth URL
      // For demo: using a test URL that will open in browser
      const authUrl = 'https://accounts.google.com/signin/v2/identifier?flowName=GlifWebSignIn&flowEntry=ServiceLogin';
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'neurotype://auth/callback'
      );

      // For testing: Navigate to premium page regardless of how browser closes
      // (success, dismiss, cancel, etc.)
      // In production, you'd check result.type === 'success' and verify the auth code
      onNavigateToPremium();
    } catch (error) {
      console.error('Google sign in error:', error);
      // Navigate to premium even on error for demo purposes
      onNavigateToPremium();
    }
  };

  const handleAppleSignIn = async () => {
    try {
      // Open OAuth URL in browser
      // TODO: Replace with your actual Apple OAuth URL
      // For demo: using a test URL that will open in browser
      const authUrl = 'https://appleid.apple.com/sign-in';
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'neurotype://auth/callback'
      );

      // For testing: Navigate to premium page regardless of how browser closes
      // (success, dismiss, cancel, etc.)
      // In production, you'd check result.type === 'success' and verify the auth code
      onNavigateToPremium();
    } catch (error) {
      console.error('Apple sign in error:', error);
      // Navigate to premium even on error for demo purposes
      onNavigateToPremium();
    }
  };

  const handleSignIn = () => {
    // TODO: Navigate to sign in screen or show sign in modal
    // For now, just proceed
    onLogin();
  };

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
          <Text style={styles.loginBackgroundTextLarge} numberOfLines={1}>That's everything.</Text>
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

            {/* Google Sign In Button */}
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleGoogleSignIn}
              activeOpacity={0.7}
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

            {/* Apple Sign In Button */}
            <TouchableOpacity 
              style={[styles.socialButton, styles.appleButton]}
              onPress={handleAppleSignIn}
              activeOpacity={0.7}
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

          </Animated.View>
        </View>
      </View>
    </View>
  );
};

// Premium Feature Card Component
const PremiumFeatureCard: React.FC<{
  icon: string;
  title: string;
  description: string;
  gradient: string[];
  delay: number;
  isActive: boolean;
}> = ({ icon, title, description, gradient, delay, isActive }) => {
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.8)).current;
  const cardTranslateY = useRef(new Animated.Value(30)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      // Staggered entrance animation
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 600,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 600,
          delay: delay,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Icon pulse animation after card appears
        Animated.loop(
          Animated.sequence([
            Animated.timing(iconScale, {
              toValue: 1.1,
              duration: 1500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(iconScale, {
              toValue: 1,
              duration: 1500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }
  }, [isActive, delay]);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(pressScale, {
      toValue: 0.95,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(pressScale, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.premiumFeatureCard,
        {
          opacity: cardOpacity,
          transform: [
            { scale: cardScale },
            { translateY: cardTranslateY },
          ],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.premiumFeatureCardTouchable}
      >
        <Animated.View
          style={{
            transform: [{ scale: pressScale }],
          }}
        >
          <LinearGradient
            colors={gradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.premiumFeatureCardGradient}
          >
          <View style={styles.premiumFeatureCardContent}>
            <Animated.View
              style={[
                styles.premiumFeatureIconContainer,
                {
                  transform: [
                    { scale: iconScale },
                  ],
                },
              ]}
            >
              <Text style={styles.premiumFeatureIcon}>{icon}</Text>
            </Animated.View>
            
            <View style={styles.premiumFeatureTextContainer}>
              <Text style={styles.premiumFeatureTitle}>{title}</Text>
              <Text style={styles.premiumFeatureDescription}>{description}</Text>
            </View>
          </View>
        </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Mock pricing data
const pricingPlans = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 9.99,
    period: 'month',
    originalPrice: null,
    savings: null,
    popular: false,
    features: [
      'Unlimited meditation sessions',
      'All modules unlocked',
      'Progress tracking',
      'Basic analytics',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 79.99,
    period: 'year',
    originalPrice: 119.88,
    savings: 'Save 33%',
    popular: true,
    features: [
      'Everything in Monthly',
      'Advanced analytics',
      'AI-powered recommendations',
      'Cloud sync across devices',
      'Priority support',
      'Early access to new features',
    ],
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: 199.99,
    period: 'one-time',
    originalPrice: null,
    savings: 'Best Value',
    popular: false,
    features: [
      'Everything in Yearly',
      'Pay once, use forever',
      'All future updates included',
      'Lifetime priority support',
    ],
  },
];

// Premium Features Page
const PremiumFeaturesPage: React.FC<{ 
  isActive: boolean;
  selectedPlan: string | null;
  onSelectPlan: (planId: string | null) => void;
}> = ({ isActive, selectedPlan, onSelectPlan }) => {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const cardsTranslateY = useRef(new Animated.Value(30)).current;
  const hasAnimated = useRef(false);
  const [currentPricingPage, setCurrentPricingPage] = useState(0);
  const pricingScrollViewRef = useRef<ScrollView>(null);
  const mainScrollViewRef = useRef<ScrollView>(null);
  const scrollProgress = useRef(new Animated.Value(0)).current;
  const [scrollContentHeight, setScrollContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const scaleAnimations = useRef(
    pricingPlans.map(() => new Animated.Value(1))
  ).current;

  useEffect(() => {
    if (isActive && !hasAnimated.current) {
      hasAnimated.current = true;
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
        Animated.timing(cardsOpacity, {
          toValue: 1,
          duration: 600,
          delay: 400,
          useNativeDriver: true,
        }),
        Animated.timing(cardsTranslateY, {
          toValue: 0,
          duration: 600,
          delay: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!isActive) {
      hasAnimated.current = false;
    }
  }, [isActive]);

  const handleSelectPlan = (planId: string) => {
    // Toggle selection - if clicking the same plan, deselect it
    const newSelectedPlan = selectedPlan === planId ? null : planId;
    onSelectPlan(newSelectedPlan);
    
    // Animate the selected card
    const index = pricingPlans.findIndex(p => p.id === planId);
    if (index !== -1) {
      Animated.sequence([
        Animated.spring(scaleAnimations[index], {
          toValue: 0.95,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimations[index], {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const calculateMonthlyEquivalent = (plan: typeof pricingPlans[0]) => {
    if (plan.period === 'year') {
      return (plan.price / 12).toFixed(2);
    }
    return plan.price.toFixed(2);
  };

  const handlePricingScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPricingPage(Math.min(page, pricingPlans.length - 1));
  };

  const handleMainScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollableHeight = contentSize.height - layoutMeasurement.height;
    if (scrollableHeight > 0) {
      const progress = contentOffset.y / scrollableHeight;
      scrollProgress.setValue(Math.min(Math.max(progress, 0), 1));
    }
  };

  const handleContentSizeChange = (contentWidth: number, contentHeight: number) => {
    setScrollContentHeight(contentHeight);
  };

  const handleScrollViewLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setScrollViewHeight(height);
  };

  const scrollableHeight = scrollContentHeight - scrollViewHeight;
  const progressBarHeight = scrollProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.page}>
      <ScrollView 
        ref={mainScrollViewRef}
        style={styles.page} 
        contentContainerStyle={styles.premiumScrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleMainScroll}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleScrollViewLayout}
        scrollEventThrottle={16}
      >
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
            <Text style={styles.titleLight}>Choose Your Plan</Text>
            <Text style={styles.subtitleLight}>Unlock the full potential of Neurotype</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.pricingContainerWrapper,
              {
                opacity: cardsOpacity,
                transform: [{ translateY: cardsTranslateY }],
              },
            ]}
          >
            <ScrollView
              ref={pricingScrollViewRef}
              horizontal
              pagingEnabled={true}
              showsHorizontalScrollIndicator={false}
              onScroll={handlePricingScroll}
              scrollEventThrottle={16}
              decelerationRate="fast"
              style={styles.pricingScrollView}
              contentContainerStyle={styles.pricingScrollContent}
            >
              {pricingPlans.map((plan, index) => {
                const isSelected = selectedPlan === plan.id;
                const monthlyPrice = calculateMonthlyEquivalent(plan);
                
                return (
                  <View key={plan.id} style={styles.pricingCardWrapper}>
                    <Animated.View
                      style={[
                        styles.pricingCard,
                        isSelected && styles.pricingCardSelected,
                        {
                          transform: [{ scale: scaleAnimations[index] }],
                        },
                      ]}
                    >
                      {plan.popular && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularBadgeText}>Most Popular</Text>
                        </View>
                      )}
                      
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => handleSelectPlan(plan.id)}
                        style={styles.pricingCardTouchable}
                      >
                        <View style={styles.pricingCardHeader}>
                          <Text style={styles.pricingCardName}>{plan.name}</Text>
                          {plan.savings && (
                            <View style={styles.savingsBadge}>
                              <Text style={styles.savingsBadgeText}>{plan.savings}</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.pricingCardPriceContainer}>
                          <View style={styles.pricingCardPriceRow}>
                            <Text style={styles.pricingCardPrice}>
                              {formatPrice(plan.price)}
                            </Text>
                            {plan.period !== 'one-time' && (
                              <Text style={styles.pricingCardPeriod}>/{plan.period}</Text>
                            )}
                          </View>
                          {plan.period === 'year' && (
                            <Text style={styles.pricingCardEquivalent}>
                              ${monthlyPrice}/month billed annually
                            </Text>
                          )}
                          {plan.originalPrice && (
                            <Text style={styles.pricingCardOriginal}>
                              ${plan.originalPrice.toFixed(2)}/year
                            </Text>
                          )}
                        </View>

                        <View style={styles.pricingCardFeatures}>
                          {plan.features.map((feature, featureIndex) => (
                            <View key={featureIndex} style={styles.pricingCardFeature}>
                              <Text style={styles.pricingCardFeatureIcon}>✓</Text>
                              <Text style={styles.pricingCardFeatureText}>{feature}</Text>
                            </View>
                          ))}
                        </View>

                        <View style={[
                          styles.pricingCardButton,
                          isSelected && styles.pricingCardButtonSelected,
                        ]}>
                          <Text style={[
                            styles.pricingCardButtonText,
                            isSelected && styles.pricingCardButtonTextSelected,
                          ]}>
                            {isSelected ? 'Selected' : 'Select Plan'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  </View>
                );
              })}
            </ScrollView>
            
            {/* Page Indicators */}
            <View style={styles.pricingIndicators}>
              {pricingPlans.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.pricingIndicator,
                    currentPricingPage === index && styles.pricingIndicatorActive,
                    index < pricingPlans.length - 1 && { marginRight: 8 },
                  ]}
                />
              ))}
            </View>
            
            {/* Cancel Anytime Text */}
            <View style={styles.pricingFooter}>
              <Text style={styles.pricingFooterText}>
                Cancel anytime. All plans include a 7-day free trial.
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.premiumFeaturesList,
              {
                opacity: cardsOpacity,
              },
            ]}
          >
            <Text style={styles.premiumFeaturesListTitle}>All Premium Features</Text>
            <Text style={styles.premiumFeaturesListSubtitle}>
              Everything you need for your meditation journey
            </Text>
            
            <View style={styles.premiumFeaturesGrid}>
              {[
                {
                  icon: '⭐',
                  title: 'Unlimited Sessions',
                  description: 'Access all meditation sessions without limits',
                  gradient: ['#FFD700', '#FFA500'],
                  delay: 600,
                },
                {
                  icon: '📊',
                  title: 'Advanced Analytics',
                  description: 'Track your progress with detailed insights and charts',
                  gradient: ['#4ECDC4', '#44A08D'],
                  delay: 700,
                },
                {
                  icon: '🎯',
                  title: 'AI Recommendations',
                  description: 'Get personalized suggestions tailored to your unique needs',
                  gradient: ['#667EEA', '#764BA2'],
                  delay: 800,
                },
                {
                  icon: '☁️',
                  title: 'Cloud Sync',
                  description: 'Sync your progress across all your devices seamlessly',
                  gradient: ['#89F7FE', '#66A6FF'],
                  delay: 900,
                },
                {
                  icon: '🔔',
                  title: 'Smart Reminders',
                  description: 'Never miss a session with intelligent notification system',
                  gradient: ['#F093FB', '#F5576C'],
                  delay: 1000,
                },
                {
                  icon: '🎨',
                  title: 'Custom Themes',
                  description: 'Personalize your experience with beautiful themes',
                  gradient: ['#FA709A', '#FEE140'],
                  delay: 1100,
                },
              ].map((feature, index) => (
                <PremiumFeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  gradient={feature.gradient}
                  delay={feature.delay}
                  isActive={isActive}
                />
              ))}
            </View>
          </Animated.View>
        </View>
      </ScrollView>
      
      {/* Scroll Progress Indicator */}
      {scrollableHeight > 0 && (
        <View style={styles.scrollProgressContainer}>
          <View style={styles.scrollProgressTrack}>
            <Animated.View
              style={[
                styles.scrollProgressBar,
                {
                  height: progressBarHeight,
                },
              ]}
            />
          </View>
        </View>
      )}
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

  const TOTAL_PAGES = 6;

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
  }, [currentPage]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPage(page);
  };

  const handleNext = () => {
    if (currentPage < TOTAL_PAGES - 1) {
      scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH * (currentPage + 1), animated: true });
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
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
            onFinish();
          });
        }, 800); // Show content for 800ms before fading out
      });
    }, 100); // Small delay before showing content
  };

  const handleSkip = () => {
    handleFinish();
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
    if (currentPage === TOTAL_PAGES - 1) {
      return selectedPlan ? 'Get Started' : "No thanks! I'll continue with Free Plan.";
    }
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
            onNavigateToPremium={() => {
              // Navigate to premium features page (page 5)
              scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH * 5, animated: true });
            }}
          />
          <PremiumFeaturesPage 
            isActive={currentPage === 5}
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
          />
          </ScrollView>
        )}

        {!showFinishAnimation && currentPage !== 4 && (
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
  disclaimerContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#8e8e93',
    lineHeight: 18,
    textAlign: 'center',
  },
  disclaimerTextLight: {
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
  premiumScrollContent: {
    paddingBottom: 10,
  },
  scrollProgressContainer: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    width: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  scrollProgressTrack: {
    width: 4,
    height: '80%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  scrollProgressBar: {
    width: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
    minHeight: 4,
  },
  premiumPricingContainer: {
    paddingHorizontal: 0,
    marginBottom: 32,
  },
  pricingContainerWrapper: {
    marginHorizontal: -20,
    width: SCREEN_WIDTH,
  },
  pricingScrollView: {
    marginHorizontal: 0,
    width: SCREEN_WIDTH,
  },
  pricingScrollContent: {
    paddingRight: 0,
  },
  pricingCardWrapper: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
  },
  pricingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    paddingTop: 32,
    borderWidth: 2,
    borderColor: '#e5e5ea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'visible',
    minHeight: 480,
    justifyContent: 'space-between',
    width: SCREEN_WIDTH - 40,
    alignSelf: 'center',
  },
  pricingCardSelected: {
    borderColor: '#007AFF',
    borderWidth: 3,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    backgroundColor: '#f8f9ff',
  },
  pricingCardTouchable: {
    width: '100%',
  },
  popularBadge: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  popularBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pricingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  pricingCardName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  savingsBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pricingCardPriceContainer: {
    marginBottom: 20,
  },
  pricingCardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  pricingCardPrice: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -1,
  },
  pricingCardPeriod: {
    fontSize: 18,
    fontWeight: '500',
    color: '#8e8e93',
    marginLeft: 4,
  },
  pricingCardEquivalent: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8e8e93',
    marginTop: 4,
  },
  pricingCardOriginal: {
    fontSize: 14,
    fontWeight: '400',
    color: '#c7c7cc',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  pricingCardFeatures: {
    marginBottom: 20,
    flex: 1,
    justifyContent: 'flex-start',
  },
  pricingIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  pricingFooter: {
    marginTop: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 8,
  },
  pricingFooterText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 18,
  },
  pricingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#c7c7cc',
  },
  pricingIndicatorActive: {
    width: 24,
    backgroundColor: '#007AFF',
  },
  pricingCardFeature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pricingCardFeatureIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34C759',
    marginRight: 10,
    marginTop: 2,
    width: 20,
  },
  pricingCardFeatureText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    lineHeight: 20,
  },
  pricingCardButton: {
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e5e5ea',
  },
  pricingCardButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  pricingCardButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  pricingCardButtonTextSelected: {
    color: '#ffffff',
  },
  premiumFeaturesList: {
    paddingHorizontal: 0,
    marginTop: 16,
  },
  premiumFeaturesListTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  premiumFeaturesListSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#8e8e93',
    marginBottom: 24,
    textAlign: 'center',
  },
  premiumFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 0,
  },
  premiumFeatureCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    height: 180,
  },
  premiumFeatureCardTouchable: {
    width: '100%',
    height: '100%',
  },
  premiumFeatureCardGradient: {
    borderRadius: 16,
    padding: 16,
    height: '100%',
  },
  premiumFeatureCardContent: {
    flex: 1,
    justifyContent: 'space-between',
    height: '100%',
  },
  premiumFeatureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  premiumFeatureIcon: {
    fontSize: 24,
  },
  premiumFeatureTextContainer: {
    flex: 1,
    marginBottom: 8,
  },
  premiumFeatureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  premiumFeatureDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  premiumFeatureArrow: {
    alignSelf: 'flex-end',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumFeatureArrowText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
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
