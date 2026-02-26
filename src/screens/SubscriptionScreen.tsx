import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { PremiumFeaturesPage } from '../components/PremiumFeaturesPage';
import { useTheme } from '../contexts/ThemeContext';

type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Subscription: undefined;
  Payment: { selectedPlan?: string | null };
};

type SubscriptionScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'Subscription'>;

export const SubscriptionScreen: React.FC = () => {
  const theme = useTheme();
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
        <View
          style={[
            styles.buttonContainer,
            {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.continueButton,
              {
                backgroundColor: theme.colors.accent,
                shadowColor: theme.colors.accent,
                shadowOpacity: theme.isDark ? 0.3 : 0.06,
              },
            ]}
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
    borderTopWidth: 1,
  },
  continueButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
});
