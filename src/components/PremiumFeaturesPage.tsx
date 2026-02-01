import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

interface PremiumFeaturesPageProps {
  isActive?: boolean;
  selectedPlan: string | null;
  onSelectPlan: (planId: string | null) => void;
  onClose: () => void;
  isOnboarding?: boolean; // True when used in onboarding horizontal scroll
}

export const PremiumFeaturesPage: React.FC<PremiumFeaturesPageProps> = ({ 
  isActive = true, 
  selectedPlan, 
  onSelectPlan, 
  onClose,
  isOnboarding = false
}) => {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const cardsTranslateY = useRef(new Animated.Value(30)).current;
  const closeButtonOpacity = useRef(new Animated.Value(0)).current;
  const closeButtonScale = useRef(new Animated.Value(0.8)).current;
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
      ]).start(() => {
        // Animate close button after everything else loads
        Animated.parallel([
          Animated.timing(closeButtonOpacity, {
            toValue: 1,
            duration: 400,
            delay: 300,
            useNativeDriver: true,
          }),
          Animated.spring(closeButtonScale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            delay: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else if (!isActive) {
      hasAnimated.current = false;
      closeButtonOpacity.setValue(0);
      closeButtonScale.setValue(0.8);
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
    <View style={[styles.page, isOnboarding && styles.pageOnboarding]}>
      {/* Close Button */}
      <Animated.View
        style={[
          styles.closeButtonContainer,
          isOnboarding ? styles.closeButtonContainerOnboarding : styles.closeButtonContainerStandalone,
          {
            opacity: closeButtonOpacity,
            transform: [{ scale: closeButtonScale }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </Animated.View>

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
        <View style={[
          styles.pageBackground,
          isOnboarding ? styles.pageBackgroundOnboarding : styles.pageBackgroundStandalone
        ]}>
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
              isOnboarding ? styles.pricingContainerWrapperOnboarding : styles.pricingContainerWrapperStandalone,
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
              style={[
                styles.pricingScrollView,
                isOnboarding ? styles.pricingScrollViewOnboarding : styles.pricingScrollViewStandalone
              ]}
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
        <View style={[
          styles.scrollProgressContainer,
          isOnboarding ? styles.scrollProgressContainerOnboarding : styles.scrollProgressContainerStandalone
        ]}>
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

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  pageOnboarding: {
    width: SCREEN_WIDTH,
  },
  pageBackground: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  pageBackgroundOnboarding: {
    paddingTop: 80, // More space for title below close button
  },
  pageBackgroundStandalone: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40, // Account for status bar and safe area
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 0,
  },
  titleLight: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitleLight: {
    fontSize: 17,
    fontWeight: '400',
    color: '#8e8e93',
    textAlign: 'center',
  },
  premiumScrollContent: {
    paddingBottom: 10,
  },
  scrollProgressContainer: {
    position: 'absolute',
    right: 8,
    bottom: 50,
    width: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  scrollProgressContainerOnboarding: {
    top: 120,
  },
  scrollProgressContainerStandalone: {
    top: Platform.OS === 'ios' ? 120 : 100,
  },
  scrollProgressTrack: {
    width: 4,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  scrollProgressBar: {
    width: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
    minHeight: 4,
  },
  closeButtonContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 1000,
  },
  closeButtonContainerOnboarding: {
    top: 60,
  },
  closeButtonContainerStandalone: {
    top: Platform.OS === 'ios' ? 60 : 40, // Account for status bar and safe area
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    lineHeight: 18,
  },
  pricingContainerWrapper: {
    marginHorizontal: -20,
  },
  pricingContainerWrapperOnboarding: {
    // No width constraint needed - parent handles it
  },
  pricingContainerWrapperStandalone: {
    width: SCREEN_WIDTH,
  },
  pricingScrollView: {
    marginHorizontal: 0,
  },
  pricingScrollViewOnboarding: {
    // Width handled by parent container
  },
  pricingScrollViewStandalone: {
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
});

