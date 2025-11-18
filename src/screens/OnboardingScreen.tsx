import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, Animated, StatusBar, TouchableOpacity, ScrollView, Dimensions, TextInput, KeyboardAvoidingView, Platform, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../styles/theme';
import { mentalHealthModules, MentalHealthModule } from '../data/modules';
import { prerenderedModuleBackgrounds } from '../store/useStore';
import { useStore } from '../store/useStore';
import { AnimatedFloatingButton } from '../components/AnimatedFloatingButton';
import { ModuleGridModal } from '../components/ModuleGridModal';

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
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
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
        <Text style={styles.title}>Welcome to Neurotype</Text>
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
        <Text style={styles.disclaimerText}>
          Your meditation data and progress are used to improve your personalized experience.
        </Text>
      </Animated.View>
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
    }
  }, [isActive]);

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
    const isScrollable = contentSize.height > layoutMeasurement.height;
    
    if (!isScrollable) {
      // Content fits on screen, hide arrow
      if (showScrollArrow) {
        setShowScrollArrow(false);
        Animated.timing(arrowOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
      return;
    }
    
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
  };

  const handleContentSizeChange = (contentWidth: number, contentHeight: number) => {
    // Check if content is scrollable when content size changes
    if (scrollViewHeight > 0) {
      const isScrollable = contentHeight > scrollViewHeight;
      if (!isScrollable && showScrollArrow) {
        setShowScrollArrow(false);
        Animated.timing(arrowOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else if (isScrollable && !showScrollArrow && contentHeight > scrollViewHeight) {
        setShowScrollArrow(true);
        Animated.timing(arrowOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const handleScrollViewLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setScrollViewHeight(height);
  };

  return (
    <View style={styles.page}>
      <Animated.View
        style={[
          styles.titleContainer,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          },
        ]}
      >
        <Text style={styles.title}>Select Your Focus</Text>
        <Text style={styles.subtitle}>Choose a module to get started</Text>
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
        
        <Animated.View 
          style={[
            styles.scrollArrowContainer,
            { opacity: arrowOpacity }
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={['transparent', 'rgba(242, 242, 247, 0.8)', 'rgba(242, 242, 247, 1)']}
            style={styles.scrollArrowGradient}
          >
            <View style={styles.scrollArrow}>
              <Text style={styles.scrollArrowText}>⌄</Text>
            </View>
          </LinearGradient>
        </Animated.View>
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
}> = ({ selectedModule, isActive, onModuleChange, onShowModal, previousModuleId }) => {
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
    // Hide the congratulations overlay
    setShowCongratulations(false);
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

  return (
    <View style={styles.page}>
      <Animated.View
        style={[
          styles.titleContainer,
          {
            opacity: titleOpacity,
          },
        ]}
      >
        <Text style={styles.title}>You Can Change Anytime</Text>
        <Text style={styles.subtitle}>Tap the change button to switch modules</Text>
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
              onPress={() => onShowModal?.()}
              activeOpacity={0.8}
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

      {/* Congratulations Overlay */}
      <CongratulationsOverlay
        visible={showCongratulations}
        moduleTitle={selectedModuleData.title}
        moduleColor={selectedModuleData.color}
        onComplete={handleCongratulationsComplete}
      />
    </View>
  );
};

// Callout Component for Instructions
const InstructionCallout: React.FC<{
  text: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  isActive?: boolean;
}> = ({ text, position, delay = 0, isActive = true }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          delay: delay,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive, delay]);

  const getArrowStyle = () => {
    switch (position) {
      case 'top':
        return styles.calloutArrowTop;
      case 'bottom':
        return styles.calloutArrowBottom;
      case 'left':
        return styles.calloutArrowLeft;
      case 'right':
        return styles.calloutArrowRight;
      default:
        return styles.calloutArrowBottom;
    }
  };

  return (
    <Animated.View
      style={[
        styles.instructionCallout,
        getArrowStyle(),
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <Text style={styles.instructionCalloutText}>{text}</Text>
    </Animated.View>
  );
};

// How to Use App Page
const HowToUsePage: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const demoOpacity = useRef(new Animated.Value(0)).current;
  const demoTranslateY = useRef(new Animated.Value(20)).current;
  const step1Opacity = useRef(new Animated.Value(0)).current;
  const step2Opacity = useRef(new Animated.Value(0)).current;
  const step3Opacity = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);
  
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
      ]).start();
    }
  }, [isActive]);

  return (
    <ScrollView 
      style={styles.page} 
      contentContainerStyle={styles.howToUseScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={[
          styles.titleContainer,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          },
        ]}
      >
        <Text style={styles.title}>How to Use the App</Text>
        <Text style={styles.subtitle}>Here's where to find your daily meditation</Text>
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
            <InstructionCallout
              text="This is your personalized recommendation - tailored just for you!"
              position="top"
              delay={1000}
              isActive={isActive}
            />
            <View style={[styles.demoRecommendedSession, { borderColor: selectedModule.color + '40' }]}>
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
                {index === 0 && (
                  <InstructionCallout
                    text="Choose any option that feels right for you right now"
                    position="left"
                    delay={1400}
                    isActive={isActive}
                  />
                )}
                <View style={styles.demoAlternativeSession}>
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
            After you complete a session, rate how effective it was. We use your feedback to make tomorrow's recommendations even better!
          </Text>
        </Animated.View>

        {/* Explanation Card */}
        <View style={styles.demoExplanationCard}>
          <View style={styles.explanationBox}>
            <Text style={styles.explanationIcon}>📊</Text>
            <View style={styles.explanationContent}>
              <Text style={styles.explanationTitle}>Your Feedback Shapes Your Experience</Text>
              <Text style={styles.explanationText}>
                Every time you complete and rate a session, our system learns what works best for you. The more you use the app, the more personalized your recommendations become.
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

// Login Page Component
const LoginPage: React.FC<{ 
  isActive: boolean;
  onLogin: () => void;
}> = ({ isActive, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

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
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 600,
          delay: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive]);

  const handleLogin = () => {
    if (email.trim() && password.trim()) {
      onLogin();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View
        style={[
          styles.titleContainer,
          {
            opacity: titleOpacity,
          },
        ]}
      >
        <Text style={styles.title}>Login to Get Started</Text>
        <Text style={styles.subtitle}>Sign in to sync your progress across devices</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.loginForm,
          {
            opacity: formOpacity,
          },
        ]}
      >
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#8e8e93"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor="#8e8e93"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity 
          style={[styles.loginButton, (!email.trim() || !password.trim()) && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={!email.trim() || !password.trim()}
          activeOpacity={0.7}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipLoginButton} onPress={onLogin} activeOpacity={0.7}>
          <Text style={styles.skipLoginText}>Skip for now</Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

// Premium Features Page
const PremiumFeaturesPage: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const hasAnimated = useRef(false);

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
      ]).start();
    }
  }, [isActive]);

  return (
    <View style={styles.page}>
      <Animated.View
        style={[
          styles.titleContainer,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          },
        ]}
      >
        <Text style={styles.title}>Premium Features</Text>
        <Text style={styles.subtitle}>Unlock the full potential</Text>
      </Animated.View>

      <View style={styles.premiumFeaturesContainer}>
        <FeaturePoint
          icon="⭐"
          title="Unlimited Sessions"
          description="Access all meditation sessions without limits"
          delay={400}
          isActive={isActive}
        />
        <FeaturePoint
          icon="📊"
          title="Advanced Analytics"
          description="Track your progress with detailed insights and charts"
          delay={600}
          isActive={isActive}
        />
        <FeaturePoint
          icon="🎯"
          title="Personalized Recommendations"
          description="Get AI-powered suggestions tailored to your unique needs"
          delay={800}
          isActive={isActive}
        />
        <FeaturePoint
          icon="☁️"
          title="Cloud Sync"
          description="Sync your progress across all your devices"
          delay={1000}
          isActive={isActive}
        />
      </View>
    </View>
  );
};

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.95)).current;
  const setTodayModuleId = useStore(state => state.setTodayModuleId);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [demoModuleId, setDemoModuleId] = useState<string | null>(null);
  const previousDemoModuleId = useRef<string | null>(null);

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
    if (selectedModule) {
      setTodayModuleId(selectedModule);
    }
    useStore.setState({ 
      hasCompletedOnboarding: true,
      isLoggedIn: true 
    });
    onFinish();
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
    if (currentPage === TOTAL_PAGES - 1) return 'Get Started';
    return 'Continue';
  };

  const canProceed = () => {
    if (currentPage === 1 && !selectedModule) return false;
    return true;
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f2f2f7" />
      <View style={styles.container}>
        {currentPage === 0 && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
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
            onShowModal={() => setShowModuleModal(true)}
            previousModuleId={previousDemoModuleId.current}
          />
          <HowToUsePage isActive={currentPage === 3} />
          <LoginPage 
            isActive={currentPage === 4}
            onLogin={handleLogin}
          />
          <PremiumFeaturesPage isActive={currentPage === 5} />
        </ScrollView>

        <View style={styles.pageIndicators}>
          {Array.from({ length: TOTAL_PAGES }).map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.indicator, 
                currentPage === index && styles.indicatorActive,
                index > 0 && { marginLeft: 8 }
              ]} 
            />
          ))}
        </View>

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
      </View>

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
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 20,
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
  subtitle: {
    ...theme.health.subtitle,
    textAlign: 'center',
    marginTop: 4,
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
  featureDescription: {
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
    bottom: -70,
    left: 0,
    right: 0,
    height: 80,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  scrollArrowGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  scrollArrow: {
    width: 40,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArrowText: {
    fontSize: 24,
    color: '#8e8e93',
    fontWeight: '200',
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
  loginForm: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    ...theme.health.inputField,
    fontSize: 17,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  loginButton: {
    ...theme.health.button,
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#c7c7cc',
  },
  loginButtonText: {
    ...theme.health.buttonText,
  },
  skipLoginButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  skipLoginText: {
    fontSize: 17,
    color: '#8e8e93',
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
    zIndex: 1000,
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
    paddingBottom: 100,
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
    backgroundColor: '#f9f9fb',
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  instructionCallout: {
    position: 'absolute',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 200,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  instructionCalloutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 18,
  },
  calloutArrowTop: {
    bottom: 0,
    left: 20,
    transform: [{ translateY: -80 }],
  },
  calloutArrowBottom: {
    top: 0,
    left: 20,
    transform: [{ translateY: 80 }],
  },
  calloutArrowLeft: {
    right: 0,
    top: 10,
    transform: [{ translateX: -220 }],
  },
  calloutArrowRight: {
    left: 0,
    top: 10,
    transform: [{ translateX: 220 }],
  },
  explanationBox: {
    backgroundColor: '#f9f9fb',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  explanationIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  explanationContent: {
    flex: 1,
  },
  explanationTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 15,
    color: '#8e8e93',
    lineHeight: 22,
  },
});
