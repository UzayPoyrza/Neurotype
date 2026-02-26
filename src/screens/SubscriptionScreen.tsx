import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { PremiumFeaturesPage } from '../components/PremiumFeaturesPage';

type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Subscription: undefined;
  Payment: { selectedPlan?: string | null };
};

type SubscriptionScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'Subscription'>;

export const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation<SubscriptionScreenNavigationProp>();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = (planId: string | null) => {
    setSelectedPlan(planId);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleContinue = () => {
    if (selectedPlan) {
      navigation.navigate('Payment', { selectedPlan });
    } else {
      // If no plan selected, just go back (free plan)
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <PremiumFeaturesPage
        isActive={true}
        selectedPlan={selectedPlan}
        onSelectPlan={handleSelectPlan}
        onClose={handleClose}
      />
      {selectedPlan && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.7}
          >
            <Text style={styles.continueButtonText}>Continue to Payment</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: '#0A0A0F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  continueButton: {
    backgroundColor: '#0A84FF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
});

