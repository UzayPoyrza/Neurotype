import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Animated, Alert, Easing } from 'react-native';
import { useStore } from '../store/useStore';

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

  // Import styles from OnboardingScreen - we'll need to copy them
  // For now, using inline styles similar to OnboardingScreen
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.page}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.page}
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
              <Text style={styles.backButtonText}>← Back</Text>
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
              <Text style={styles.titleLight}>Complete Your Purchase</Text>
              <Text style={styles.subtitleLight}>
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
                <Text style={styles.formSectionTitle}>Select a Plan</Text>
                {pricingPlans.map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={styles.planOption}
                    onPress={() => setSelectedPlan(plan.id)}
                  >
                    <Text style={styles.planOptionName}>{plan.name}</Text>
                    <Text style={styles.planOptionPrice}>
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
                    opacity: formOpacity,
                    transform: [{ translateY: formTranslateY }],
                  },
                ]}
              >
                <View style={styles.planSummaryHeader}>
                  <Text style={styles.planSummaryTitle}>{selectedPlanData.name} Plan</Text>
                  {selectedPlanData.savings && (
                    <View style={styles.paymentSavingsBadge}>
                      <Text style={styles.paymentSavingsBadgeText}>{selectedPlanData.savings}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.planSummaryPrice}>
                  <Text style={styles.planPrice}>${selectedPlanData.price.toFixed(2)}</Text>
                  <Text style={styles.planPeriod}>
                    {selectedPlanData.period === 'month' ? '/month' : selectedPlanData.period === 'year' ? '/year' : ' one-time'}
                  </Text>
                </View>
                {selectedPlanData.originalPrice && (
                  <Text style={styles.originalPrice}>
                    ${selectedPlanData.originalPrice.toFixed(2)} before discount
                  </Text>
                )}
                <Text style={styles.freeTrialText}>7-day free trial • Cancel anytime</Text>
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
                <Text style={styles.formSectionTitle}>Payment Information</Text>

                {/* Card Number */}
                <View style={styles.paymentInputContainer}>
                  <Text style={styles.paymentInputLabel}>Card Number</Text>
                  <TextInput
                    style={[
                      styles.paymentInput,
                      errors.cardNumber && styles.paymentInputError
                    ]}
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                    keyboardType="numeric"
                    maxLength={19}
                    placeholderTextColor="#6B6B7B"
                  />
                </View>

                {/* Expiry and CVV Row */}
                <View style={styles.paymentInputRow}>
                  <View style={[styles.paymentInputContainer, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.paymentInputLabel}>Expiry Date</Text>
                    <TextInput
                      style={[
                        styles.paymentInput,
                        errors.expiryDate && styles.paymentInputError
                      ]}
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChangeText={handleExpiryChange}
                      keyboardType="numeric"
                      maxLength={5}
                      placeholderTextColor="#6B6B7B"
                    />
                  </View>
                  <View style={[styles.paymentInputContainer, { flex: 1, marginLeft: 10 }]}>
                    <Text style={styles.paymentInputLabel}>CVV</Text>
                    <TextInput
                      style={[
                        styles.paymentInput,
                        errors.cvv && styles.paymentInputError
                      ]}
                      placeholder="123"
                      value={cvv}
                      onChangeText={handleCvvChange}
                      keyboardType="numeric"
                      maxLength={3}
                      secureTextEntry
                      placeholderTextColor="#6B6B7B"
                    />
                  </View>
                </View>

                {/* Cardholder Name */}
                <View style={styles.paymentInputContainer}>
                  <Text style={styles.paymentInputLabel}>Cardholder Name</Text>
                  <TextInput
                    style={[
                      styles.paymentInput,
                      errors.cardholderName && styles.paymentInputError
                    ]}
                    placeholder="John Doe"
                    value={cardholderName}
                    onChangeText={handleCardholderNameChange}
                    placeholderTextColor="#6B6B7B"
                  />
                </View>

                {/* Email */}
                <View style={styles.paymentInputContainer}>
                  <Text style={styles.paymentInputLabel}>Email</Text>
                  <TextInput
                    style={[
                      styles.paymentInput,
                      errors.email && styles.paymentInputError
                    ]}
                    placeholder="your.email@example.com"
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#6B6B7B"
                  />
                </View>

                {/* Security Notice */}
                <View style={styles.securityNotice}>
                  <Text style={styles.securityIcon}>🔒</Text>
                  <Text style={styles.securityText}>
                    Your payment information is encrypted and secure. We never store your full card details.
                  </Text>
                </View>

                {/* Complete Purchase Button */}
                <TouchableOpacity
                  style={[
                    styles.completePurchaseButton,
                    (!isFormValid() || isProcessing) && styles.completePurchaseButtonDisabled
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
                      !isFormValid() && styles.completePurchaseButtonTextDisabled
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
            <View style={styles.processingContent}>
              <View style={styles.processingSpinnerContainer}>
                <Animated.View 
                  style={[
                    styles.processingSpinner,
                    { transform: [{ rotate: spinnerInterpolate }] }
                  ]}
                />
              </View>
              <Text style={styles.processingText}>Processing your payment...</Text>
              <Text style={styles.processingSubtext}>Please wait</Text>
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
                  transform: [{ scale: successScale }],
                }
              ]}
            >
              <View style={styles.successIconContainer}>
                <Text style={styles.successIcon}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Payment Successful!</Text>
              <Text style={styles.successSubtext}>Your subscription is now active</Text>
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
    backgroundColor: '#0A0A0F',
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
    color: '#0A84FF',
  },
  titleContainer: {
    marginBottom: 30,
  },
  titleLight: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F2F2F7',
    marginBottom: 8,
  },
  subtitleLight: {
    fontSize: 17,
    fontWeight: '400',
    color: '#A0A0B0',
    lineHeight: 24,
  },
  planSelection: {
    marginBottom: 30,
  },
  planOption: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  planOptionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F2F2F7',
    marginBottom: 4,
  },
  planOptionPrice: {
    fontSize: 16,
    fontWeight: '400',
    color: '#A0A0B0',
  },
  planSummary: {
    backgroundColor: '#1C1C1E',
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
    color: '#F2F2F7',
  },
  paymentSavingsBadge: {
    backgroundColor: '#34C759',
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
    color: '#F2F2F7',
  },
  planPeriod: {
    fontSize: 18,
    fontWeight: '400',
    color: '#A0A0B0',
    marginLeft: 4,
  },
  originalPrice: {
    fontSize: 14,
    fontWeight: '400',
    color: '#A0A0B0',
    textDecorationLine: 'line-through',
    marginBottom: 8,
  },
  freeTrialText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#A0A0B0',
  },
  paymentForm: {
    marginBottom: 20,
  },
  formSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F2F2F7',
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
    color: '#F2F2F7',
    marginBottom: 8,
  },
  paymentInput: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '400',
    color: '#F2F2F7',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  paymentInputError: {
    borderColor: '#ff3b30',
    borderWidth: 2,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2C2C2E',
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
    color: '#A0A0B0',
    lineHeight: 20,
  },
  completePurchaseButton: {
    backgroundColor: '#0A84FF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completePurchaseButtonDisabled: {
    backgroundColor: '#2C2C2E',
    shadowOpacity: 0,
  },
  completePurchaseButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  completePurchaseButtonTextDisabled: {
    color: '#A0A0B0',
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
    backgroundColor: '#1C1C1E',
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
    borderColor: '#0A84FF',
    borderTopColor: 'transparent',
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F2F2F7',
    marginBottom: 8,
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#A0A0B0',
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
    backgroundColor: '#1C1C1E',
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
    backgroundColor: '#34C759',
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
    color: '#F2F2F7',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 16,
    fontWeight: '400',
    color: '#A0A0B0',
    textAlign: 'center',
  },
});


