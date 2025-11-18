import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated, StatusBar, TouchableOpacity, ScrollView, Dimensions, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
                    {isSelected && (
                      <View style={styles.checkmarkContainer}>
                        <Text style={styles.checkmark}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.moduleDescription}>{module.description}</Text>
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

// Change Button Demo Page
const ChangeButtonDemoPage: React.FC<{ 
  selectedModule: string | null;
  isActive: boolean;
  onModuleChange?: (moduleId: string) => void;
  onShowModal?: () => void;
}> = ({ selectedModule, isActive, onModuleChange, onShowModal }) => {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  const selectedModuleData = mentalHealthModules.find(m => m.id === selectedModule) || mentalHealthModules[0];

  useEffect(() => {
    if (isActive && !hasAnimated.current) {
      hasAnimated.current = true;
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isActive]);

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
      </View>
    </View>
  );
};

// How to Use App Page
const HowToUsePage: React.FC<{ isActive: boolean }> = ({ isActive }) => {
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
        <Text style={styles.title}>How to Use the App</Text>
      </Animated.View>

      <View style={styles.stepsContainer}>
        <FeaturePoint
          icon="📅"
          title="Daily Recommendations"
          description="Each day, you'll receive personalized meditation sessions tailored to your goals."
          delay={400}
          isActive={isActive}
        />
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>↓</Text>
        </View>
        <FeaturePoint
          icon="✅"
          title="Complete & Rate"
          description="Complete your sessions and rate their effectiveness to help us learn what works best for you."
          delay={600}
          isActive={isActive}
        />
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>↓</Text>
        </View>
        <FeaturePoint
          icon="🎯"
          title="More Tailored"
          description="Your recommendations become increasingly personalized based on your progress and feedback."
          delay={800}
          isActive={isActive}
        />
      </View>
    </View>
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
    setDemoModuleId(moduleId);
    setSelectedModule(moduleId);
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

      {/* Draggable Change Button - Only visible on page 2 */}
      {currentPage === 2 && (() => {
        const activeModuleId = demoModuleId || selectedModule || 'anxiety';
        const activeModule = mentalHealthModules.find(m => m.id === activeModuleId);
        const buttonColor = activeModule?.color || '#007AFF';
        return (
          <AnimatedFloatingButton
            backgroundColor={buttonColor}
            onPress={() => setShowModuleModal(true)}
            isPillMode={false}
          />
        );
      })()}

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
  },
  moduleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkmark: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  demoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
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
});
