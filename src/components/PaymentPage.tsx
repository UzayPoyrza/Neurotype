import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Animated, Alert, Easing, Dimensions } from 'react-native';
import { CardField, useConfirmPayment } from '@stripe/stripe-react-native';
import { useStore } from '../store/useStore';
import { createSubscription, updateUserSubscription } from '../services/paymentService';
import { useUserId } from '../hooks/useUserId';
import { useTheme } from '../contexts/ThemeContext';

const pricingPlans = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 9.99,
    period: 'month',
    originalPrice: null,
    savings: null,
    popular: false,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 79.99,
    period: 'year',
    originalPrice: 119.88,
    savings: 'Save 33%',
    popular: true,
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: 199.99,
    period: 'one-time',
    originalPrice: null,
    savings: 'Best Value',
    popular: false,
  },
];

interface PaymentPageProps {
  isActive?: boolean;
  selectedPlan: string | null;
  onBack: () => void;
  onComplete: () => void;
  isOnboarding?: boolean; // True when used in onboarding horizontal scroll
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  isActive = true,
  selectedPlan,
  onBack,
  onComplete,
  isOnboarding = false
}) => {
  const theme = useTheme();
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(30)).current;
  const hasAnimated = useRef(false);

  const [cardholderName, setCardholderName] = useState('');
  const [email, setEmail] = useState('');
  const { confirmPayment } = useConfirmPayment();
  const userId = useUserId();
  const [cardDetails, setCardDetails] = useState<{
    complete: boolean;
    brand?: string;
  } | null>(null);

  const [errors, setErrors] = useState<{
    cardholderName: boolean;
    email: boolean;
  }>({
    cardholderName: false,
    email: false,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const processingOpacity = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.8)).current;
  const spinnerRotation = useRef(new Animated.Value(0)).current;

  // Spinner rotation animation
  useEffect(() => {
    if (isProcessing) {
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
  }, [isProcessing]);

  const spinnerInterpolate = spinnerRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const selectedPlanData = pricingPlans.find(p => p.id === selectedPlan);

  // Validate all fields
  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'cardholderName':
        return value.trim().length >= 2;
      case 'email':
        return value.trim().includes('@') && value.trim().includes('.') && value.trim().length > 5;
      default:
        return false;
    }
  };

  const isFormValid = () => {
    return (
      cardDetails?.complete === true &&
      validateField('cardholderName', cardholderName) &&
      validateField('email', email)
    );
  };

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
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 600,
          delay: 400,
          useNativeDriver: true,
        }),
        Animated.timing(formTranslateY, {
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

  const handleCardholderNameChange = (text: string) => {
    setCardholderName(text);
    const isValid = validateField('cardholderName', text);
    setErrors(prev => ({ ...prev, cardholderName: text.length > 0 && !isValid }));
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    const isValid = validateField('email', text);
    setErrors(prev => ({ ...prev, email: text.length > 0 && !isValid }));
  };

  const handlePayment = async () => {
    // Validate form
    if (!cardDetails?.complete || !cardholderName.trim() || !email.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (!selectedPlanData || !userId) {
      Alert.alert('Error', 'Missing plan information or user not logged in');
      return;
    }

    setIsProcessing(true);
    setIsSuccess(false);

    // Show processing animation
    Animated.timing(processingOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    try {
      // Step 1: Create subscription or payment intent via your backend
      const subscriptionData = await createSubscription({
        planId: selectedPlanData.id,
      });

      // Step 2: Confirm payment with Stripe SDK
      const { error: confirmError, paymentIntent } = await confirmPayment(subscriptionData.clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: cardholderName,
            email: email,
          },
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment confirmation failed');
      }

      if (paymentIntent?.status !== 'Succeeded') {
        throw new Error(`Payment status: ${paymentIntent?.status}`);
      }

      console.log('✅ Payment confirmed:', {
        type: subscriptionData.type,
        subscriptionId: subscriptionData.subscriptionId,
        paymentIntentId: subscriptionData.paymentIntentId,
      });

      // Step 3: Update user subscription in database (optimistic update)
      // Webhook will also update it, so this is safe
      try {
        await updateUserSubscription(userId, 'premium');
        const setSubscriptionType = useStore.getState().setSubscriptionType;
        setSubscriptionType('premium');
        console.log('✅ Subscription updated optimistically');
      } catch (updateError) {
        console.warn('⚠️ Optimistic update failed, webhook will handle it:', updateError);
        // Don't throw - webhook will update it
      }

      // Payment successful
      setIsProcessing(false);
      Animated.timing(processingOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIsSuccess(true);
        Animated.parallel([
          Animated.timing(successOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(successScale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();

        // Complete after showing success animation
        setTimeout(() => {
          onComplete();
        }, 1500);
      });

    } catch (error: any) {
      // Payment failed - stay on payment page
      setIsProcessing(false);
      setIsSuccess(false);
      Animated.timing(processingOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Reset success animation values
        successOpacity.setValue(0);
        successScale.setValue(0.8);

        // Show user-friendly error message
        const errorMessage = error.message || 'Unable to process your payment. Please try again.';

        Alert.alert(
          'Payment Failed',
          errorMessage,
          [
            {
              text: 'OK',
              style: 'default',
              onPress: () => {
                // User stays on payment page - no navigation
              },
            },
          ]
        );
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.page, { backgroundColor: theme.colors.background }, isOnboarding && styles.pageOnboarding]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={[styles.page, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.paymentScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[
          styles.paymentPageBackground,
          isOnboarding ? styles.paymentPageBackgroundOnboarding : styles.paymentPageBackgroundStandalone
        ]}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.accent }]}>← Back</Text>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.titleContainer,
              isOnboarding ? styles.titleContainerOnboarding : styles.titleContainerStandalone,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
          >
            <Text style={[styles.titleLight, { color: theme.colors.text.primary }]}>Complete Your Purchase</Text>
            <Text style={[styles.subtitleLight, { color: theme.colors.text.secondary }]}>
              {selectedPlanData ? `You're subscribing to ${selectedPlanData.name} Plan` : 'Select a plan to continue'}
            </Text>
          </Animated.View>

          {/* Plan Summary */}
          {selectedPlanData && (
            <Animated.View
              style={[
                styles.planSummary,
                isOnboarding ? styles.planSummaryOnboarding : styles.planSummaryStandalone,
                {
                  backgroundColor: theme.colors.surface,
                  opacity: formOpacity,
                  transform: [{ translateY: formTranslateY }],
                },
              ]}
            >
              <View style={styles.planSummaryHeader}>
                <Text style={[styles.planSummaryTitle, { color: theme.colors.text.primary }]}>{selectedPlanData.name} Plan</Text>
                {selectedPlanData.savings && (
                  <View style={[styles.paymentSavingsBadge, { backgroundColor: theme.colors.success }]}>
                    <Text style={styles.paymentSavingsBadgeText}>{selectedPlanData.savings}</Text>
                  </View>
                )}
              </View>
              <View style={styles.planSummaryPrice}>
                <Text style={[styles.planPrice, { color: theme.colors.text.primary }]}>${selectedPlanData.price.toFixed(2)}</Text>
                <Text style={[styles.planPeriod, { color: theme.colors.text.secondary }]}>
                  {selectedPlanData.period === 'month' ? '/month' : selectedPlanData.period === 'year' ? '/year' : ' one-time'}
                </Text>
              </View>
              {selectedPlanData.originalPrice && (
                <Text style={[styles.originalPrice, { color: theme.colors.text.secondary }]}>
                  ${selectedPlanData.originalPrice.toFixed(2)} before discount
                </Text>
              )}
              <Text style={[styles.freeTrialText, { color: theme.colors.text.secondary }]}>7-day free trial • Cancel anytime</Text>
            </Animated.View>
          )}

          {/* Payment Form */}
          <Animated.View
            style={[
              styles.paymentForm,
              {
                opacity: formOpacity,
                transform: [{ translateY: formTranslateY }],
              },
            ]}
          >
            <Text style={[styles.formSectionTitle, { color: theme.colors.text.primary }]}>Payment Information</Text>

            {/* Card Details - Using Stripe CardField */}
            <View style={styles.paymentInputContainer}>
              <Text style={[styles.paymentInputLabel, { color: theme.colors.text.primary }]}>Card Details</Text>
              <CardField
                postalCodeEnabled={false}
                placeholders={{
                  number: '4242 4242 4242 4242',
                }}
                cardStyle={{
                  backgroundColor: theme.colors.surface,
                  textColor: theme.colors.text.primary,
                  placeholderColor: theme.colors.text.tertiary,
                  borderWidth: 1,
                  borderColor: cardDetails?.complete === false ? '#FF3B30' : theme.colors.border,
                  borderRadius: 12,
                  fontSize: 17,
                }}
                style={styles.cardField}
                onCardChange={(cardDetails) => {
                  setCardDetails(cardDetails);
                }}
              />
            </View>

            {/* Cardholder Name */}
            <View style={styles.paymentInputContainer}>
              <Text style={[styles.paymentInputLabel, { color: theme.colors.text.primary }]}>Cardholder Name</Text>
              <TextInput
                style={[
                  styles.paymentInput,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text.primary,
                    borderColor: errors.cardholderName ? '#FF3B30' : theme.colors.border,
                    borderWidth: errors.cardholderName ? 2 : 1,
                  },
                ]}
                placeholder="John Doe"
                value={cardholderName}
                onChangeText={handleCardholderNameChange}
                placeholderTextColor={theme.colors.text.tertiary}
              />
            </View>

            {/* Email */}
            <View style={styles.paymentInputContainer}>
              <Text style={[styles.paymentInputLabel, { color: theme.colors.text.primary }]}>Email</Text>
              <TextInput
                style={[
                  styles.paymentInput,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text.primary,
                    borderColor: errors.email ? '#FF3B30' : theme.colors.border,
                    borderWidth: errors.email ? 2 : 1,
                  },
                ]}
                placeholder="your.email@example.com"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={theme.colors.text.tertiary}
              />
            </View>

            {/* Security Notice */}
            <View style={[styles.securityNotice, { backgroundColor: theme.colors.surfaceElevated }]}>
              <Text style={styles.securityIcon}>🔒</Text>
              <Text style={[styles.securityText, { color: theme.colors.text.secondary }]}>
                Your payment information is encrypted and secure. We never store your full card details.
              </Text>
            </View>

            {/* Complete Purchase Button */}
            <TouchableOpacity
              style={[
                styles.completePurchaseButton,
                {
                  backgroundColor: (!isFormValid() || isProcessing) ? theme.colors.surfaceElevated : theme.colors.accent,
                  shadowColor: theme.colors.accent,
                  shadowOpacity: (!isFormValid() || isProcessing) ? 0 : (theme.isDark ? 0.3 : 0.06),
                },
              ]}
              onPress={handlePayment}
              activeOpacity={0.7}
              disabled={!isFormValid() || isProcessing}
            >
              {isProcessing ? (
                <View style={styles.processingContainer}>
                  <Animated.View
                    style={[
                      styles.spinner,
                      {
                        transform: [{ rotate: spinnerInterpolate }],
                        opacity: processingOpacity
                      }
                    ]}
                  />
                  <Text style={styles.completePurchaseButtonText}>Processing...</Text>
                </View>
              ) : (
                <Text style={[
                  styles.completePurchaseButtonText,
                  !isFormValid() && { color: theme.colors.text.secondary },
                ]}>
                  Complete Purchase
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Processing Overlay */}
      {isProcessing && (
        <Animated.View
          style={[
            styles.processingOverlay,
            { opacity: processingOpacity }
          ]}
        >
          <View style={[styles.processingContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.processingSpinnerContainer}>
              <Animated.View
                style={[
                  styles.processingSpinner,
                  {
                    borderColor: theme.colors.accent,
                    transform: [{ rotate: spinnerInterpolate }],
                  }
                ]}
              />
            </View>
            <Text style={[styles.processingText, { color: theme.colors.text.primary }]}>Processing your payment...</Text>
            <Text style={[styles.processingSubtext, { color: theme.colors.text.secondary }]}>Please wait</Text>
          </View>
        </Animated.View>
      )}

      {/* Success Overlay */}
      {isSuccess && (
        <Animated.View
          style={[
            styles.successOverlay,
            {
              opacity: successOpacity,
            }
          ]}
        >
          <Animated.View
            style={[
              styles.successContent,
              {
                backgroundColor: theme.colors.surface,
                transform: [{ scale: successScale }],
              }
            ]}
          >
            <View style={[styles.successIconContainer, { backgroundColor: theme.colors.success }]}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={[styles.successTitle, { color: theme.colors.text.primary }]}>Payment Successful!</Text>
            <Text style={[styles.successSubtext, { color: theme.colors.text.secondary }]}>Your subscription is now active</Text>
          </Animated.View>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  pageOnboarding: {
    width: Dimensions.get('window').width,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  titleContainerOnboarding: {
    marginTop: -8, // Move up to align with back button in onboarding
  },
  titleContainerStandalone: {
    marginTop: 0, // Normal spacing for standalone
  },
  titleLight: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitleLight: {
    fontSize: 17,
    fontWeight: '400',
    textAlign: 'center',
  },
  paymentScrollContent: {
    paddingBottom: 40,
  },
  paymentPageBackground: {
    flex: 1,
    width: '100%',
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  paymentPageBackgroundOnboarding: {
    paddingTop: 50, // Reduced for better alignment
  },
  paymentPageBackgroundStandalone: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40, // More space for standalone (from Profile/Settings)
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    marginTop: 0,
    marginBottom: 8, // Reduced spacing to align with title
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  planSummary: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  planSummaryOnboarding: {
    marginHorizontal: 0, // No extra margin in onboarding
  },
  planSummaryStandalone: {
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  planSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planSummaryTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  paymentSavingsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentSavingsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  planSummaryPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '700',
    marginRight: 8,
  },
  planPeriod: {
    fontSize: 18,
    fontWeight: '400',
  },
  originalPrice: {
    fontSize: 14,
    fontWeight: '400',
    textDecorationLine: 'line-through',
    marginBottom: 8,
  },
  freeTrialText: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 8,
  },
  paymentForm: {
    paddingHorizontal: 20,
  },
  formSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  paymentInputContainer: {
    marginBottom: 20,
  },
  paymentInputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  paymentInputLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  paymentInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
  },
  securityNotice: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    alignItems: 'flex-start',
  },
  securityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  completePurchaseButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  completePurchaseButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderTopColor: 'transparent',
    marginRight: 8,
  },
  processingOverlay: {
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
  processingContent: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 280,
  },
  processingSpinnerContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  processingSpinner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    borderTopColor: 'transparent',
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  successOverlay: {
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
  successContent: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 280,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 50,
    color: '#ffffff',
    fontWeight: '700',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 8,
  },
});
