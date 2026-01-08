import React from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { PaymentPage } from '../components/PaymentPage';

type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Payment: { selectedPlan?: string | null };
};

type PaymentScreenRouteProp = RouteProp<ProfileStackParamList, 'Payment'>;
type PaymentScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'Payment'>;

export const PaymentScreen: React.FC = () => {
  const navigation = useNavigation<PaymentScreenNavigationProp>();
  const route = useRoute<PaymentScreenRouteProp>();
  const selectedPlan = route.params?.selectedPlan || 'yearly';

  const handlePaymentComplete = () => {
    // Exit payment screens and return to ProfileMain
    navigation.popToTop();
  };

  return (
    <PaymentPage
      isActive={true}
      selectedPlan={selectedPlan}
      onBack={() => navigation.goBack()}
      onComplete={handlePaymentComplete}
    />
  );
};

