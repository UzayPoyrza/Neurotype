import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Animated, Alert, Easing } from 'react-native';
import { useStore } from '../store/useStore';
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

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  defaultPlan?: string | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onClose,
  defaultPlan = 'yearly' // Default to yearly plan
}) => {
  const theme = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(defaultPlan);
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(30)).current;
  const hasAnimated = useRef(false);

  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [email, setEmail] = useState('');

  const [errors, setErrors] = useState<{
    cardNumber: boolean;
    expiryDate: boolean;
    cvv: boolean;
    cardholderName: boolean;
    email: boolean;
  }>({
    cardNumber: false,
    expiryDate: false,
    cvv: false,
    cardholderName: false,
    email: false,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const processingOpacity = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.8)).current;
  const spinnerRotation = useRef(new Animated.Value(0)).current;
  const setSubscriptionType = useStore(state => state.setSubscriptionType);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      setSelectedPlan(defaultPlan);
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      setCardholderName('');
      setEmail('');
      setIsProcessing(false);
      setIsSuccess(false);
      hasAnimated.current = false;
      titleOpacity.setValue(0);
      titleTranslateY.setValue(20);
      formOpacity.setValue(0);
      formTranslateY.setValue(30);
      processingOpacity.setValue(0);
      successOpacity.setValue(0);
      successScale.setValue(0.8);
    }
  }, [visible, defaultPlan]);

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

  // Animate on open
  useEffect(() => {
    if (visible && !hasAnimated.current) {
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
    } else if (!visible) {
      hasAnimated.current = false;
    }
  }, [visible]);

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'cardNumber':
        const cleanedCard = value.replace(/\s/g, '');
        return cleanedCard.length >= 16 && cleanedCard.length <= 19;
      case 'expiryDate':
        if (value.length !== 5) return false;
        const parts = value.split('/');
        if (parts.length !== 2) return false;
        const [month, year] = parts;
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);
        if (isNaN(monthNum) || isNaN(yearNum)) return false;
        return monthNum >= 1 && monthNum <= 12 && yearNum >= 0 && yearNum <= 99;
      case 'cvv':
        return value.length === 3;
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
      validateField('cardNumber', cardNumber) &&
      validateField('expiryDate', expiryDate) &&
      validateField('cvv', cvv) &&
      validateField('cardholderName', cardholderName) &&
      validateField('email', email) &&
      selectedPlan !== null
    );
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const digits = cleaned.substring(0, 4);
    if (digits.length >= 2) {
      return digits.substring(0, 2) + '/' + digits.substring(2, 4);
    }
    return digits;
  };

  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    setCardNumber(formatted);
    const isValid = validateField('cardNumber', formatted);
    setErrors(prev => ({ ...prev, cardNumber: formatted.length > 0 && !isValid }));
  };

  const handleExpiryChange = (text: string) => {
    const formatted = formatExpiryDate(text);
    setExpiryDate(formatted);
    const isValid = validateField('expiryDate', formatted);
    setErrors(prev => ({ ...prev, expiryDate: formatted.length > 0 && !isValid }));
  };

  const handleCvvChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').substring(0, 3);
    setCvv(cleaned);
    const isValid = validateField('cvv', cleaned);
    setErrors(prev => ({ ...prev, cvv: cleaned.length > 0 && !isValid }));
  };

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
    if (!isFormValid()) {
      return;
    }

    setIsProcessing(true);
    setIsSuccess(false);

    Animated.timing(processingOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          const isSuccessful = Math.random() > 0.2;

          if (isSuccessful) {
            resolve(true);
          } else {
            const errorTypes = [
              { reason: 'Insufficient funds', message: 'Your card has insufficient funds. Please use a different payment method.' },
              { reason: 'Card declined', message: 'Your card was declined. Please check your card details or try a different card.' },
              { reason: 'Expired card', message: 'Your card has expired. Please use a different payment method.' },
              { reason: 'Invalid card', message: 'The card number you entered is invalid. Please check and try again.' },
              { reason: 'Network error', message: 'Unable to process payment due to a network error. Please check your connection and try again.' },
            ];
            const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
            reject(randomError);
          }
        }, 2000);
      });

      // Payment successful - set subscription to premium
      setSubscriptionType('premium');

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

        setTimeout(() => {
          onClose();
        }, 1500);
      });

    } catch (error: any) {
      setIsProcessing(false);
      setIsSuccess(false);
      Animated.timing(processingOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        successOpacity.setValue(0);
        successScale.setValue(0.8);

        Alert.alert(
          'Payment Failed',
          error.message || 'Unable to process your payment. Please try again.',
          [{ text: 'OK' }]
        );
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.page, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={[styles.page, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={styles.paymentScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.paymentPageBackground}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.backButtonText, { color: theme.colors.accent }]}>← Back</Text>
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.titleContainer,
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

            {/* Plan Selection */}
            {!selectedPlan && (
              <Animated.View
                style={[
                  styles.planSelection,
                  {
                    opacity: formOpacity,
                    transform: [{ translateY: formTranslateY }],
                  },
                ]}
              >
                <Text style={[styles.formSectionTitle, { color: theme.colors.text.primary }]}>Select a Plan</Text>
                {pricingPlans.map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planOption,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={() => setSelectedPlan(plan.id)}
                  >
                    <Text style={[styles.planOptionName, { color: theme.colors.text.primary }]}>{plan.name}</Text>
                    <Text style={[styles.planOptionPrice, { color: theme.colors.text.secondary }]}>
                      ${plan.price.toFixed(2)}
                      {plan.period === 'month' ? '/month' : plan.period === 'year' ? '/year' : ' one-time'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}

            {/* Plan Summary */}
            {selectedPlanData && (
              <Animated.View
                style={[
                  styles.planSummary,
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
            {selectedPlan && (
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

                {/* Card Number */}
                <View style={styles.paymentInputContainer}>
                  <Text style={[styles.paymentInputLabel, { color: theme.colors.text.primary }]}>Card Number</Text>
                  <TextInput
                    style={[
                      styles.paymentInput,
                      {
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text.primary,
                        borderColor: errors.cardNumber ? '#ff3b30' : theme.colors.border,
                        borderWidth: errors.cardNumber ? 2 : 1,
                      },
                    ]}
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                    keyboardType="numeric"
                    maxLength={19}
                    placeholderTextColor={theme.colors.text.tertiary}
                  />
                </View>

                {/* Expiry and CVV Row */}
                <View style={styles.paymentInputRow}>
                  <View style={[styles.paymentInputContainer, { flex: 1, marginRight: 10 }]}>
                    <Text style={[styles.paymentInputLabel, { color: theme.colors.text.primary }]}>Expiry Date</Text>
                    <TextInput
                      style={[
                        styles.paymentInput,
                        {
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.text.primary,
                          borderColor: errors.expiryDate ? '#ff3b30' : theme.colors.border,
                          borderWidth: errors.expiryDate ? 2 : 1,
                        },
                      ]}
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChangeText={handleExpiryChange}
                      keyboardType="numeric"
                      maxLength={5}
                      placeholderTextColor={theme.colors.text.tertiary}
                    />
                  </View>
                  <View style={[styles.paymentInputContainer, { flex: 1, marginLeft: 10 }]}>
                    <Text style={[styles.paymentInputLabel, { color: theme.colors.text.primary }]}>CVV</Text>
                    <TextInput
                      style={[
                        styles.paymentInput,
                        {
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.text.primary,
                          borderColor: errors.cvv ? '#ff3b30' : theme.colors.border,
                          borderWidth: errors.cvv ? 2 : 1,
                        },
                      ]}
                      placeholder="123"
                      value={cvv}
                      onChangeText={handleCvvChange}
                      keyboardType="numeric"
                      maxLength={3}
                      secureTextEntry
                      placeholderTextColor={theme.colors.text.tertiary}
                    />
                  </View>
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
                        borderColor: errors.cardholderName ? '#ff3b30' : theme.colors.border,
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
                        borderColor: errors.email ? '#ff3b30' : theme.colors.border,
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
            )}
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
    </Modal>
  );
};

// Copy styles from OnboardingScreen - simplified version
const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  paymentScrollContent: {
    flexGrow: 1,
  },
  paymentPageBackground: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 20,
    marginTop: 0,
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  titleContainer: {
    marginBottom: 30,
  },
  titleLight: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitleLight: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 24,
  },
  planSelection: {
    marginBottom: 30,
  },
  planOption: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  planOptionName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  planOptionPrice: {
    fontSize: 16,
    fontWeight: '400',
  },
  planSummary: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
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
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
  },
  planPeriod: {
    fontSize: 18,
    fontWeight: '400',
    marginLeft: 4,
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
  },
  paymentForm: {
    marginBottom: 20,
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
    fontSize: 16,
    fontWeight: '400',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
    marginTop: 10,
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
});
