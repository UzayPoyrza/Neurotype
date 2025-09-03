import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';

interface SessionRatingProps {
  onSubmit: (rating: number) => void;
  onCancel: () => void;
}

export const SessionRating: React.FC<SessionRatingProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleRatingSelect = (rating: number) => {
    setSelectedRating(rating);
  };

  const handleSubmit = () => {
    if (selectedRating !== null) {
      onSubmit(selectedRating);
    }
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Very Difficult';
      case 2: return 'Difficult';
      case 3: return 'Neutral';
      case 4: return 'Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>How was your session?</Text>
        <Text style={styles.subtitle}>Rate your experience to help us personalize your journey</Text>

        {/* Rating Scale */}
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <TouchableOpacity
              key={rating}
              style={[
                styles.ratingButton,
                selectedRating === rating && styles.selectedRating,
              ]}
              onPress={() => handleRatingSelect(rating)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.ratingNumber,
                  selectedRating === rating && styles.selectedRatingNumber,
                ]}
              >
                {rating}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rating Description */}
        {selectedRating && (
          <View style={styles.ratingDescription}>
            <Text style={styles.ratingText}>{getRatingText(selectedRating)}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Skip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.submitButton,
              selectedRating === null && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={selectedRating === null}
          >
            <Text
              style={[
                styles.submitButtonText,
                selectedRating === null && styles.disabledButtonText,
              ]}
            >
              Submit Rating
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: theme.typography.fontFamily,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
    fontFamily: theme.typography.fontFamily,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  ratingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.background,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedRating: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  ratingNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
  },
  selectedRatingNumber: {
    color: theme.colors.text.onPrimary,
  },
  ratingDescription: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 40,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.border,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily,
  },
  submitButton: {
    flex: 2,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.onPrimary,
    fontFamily: theme.typography.fontFamily,
  },
  disabledButton: {
    backgroundColor: theme.colors.disabled,
    borderColor: theme.colors.disabled,
  },
  disabledButtonText: {
    color: theme.colors.disabledText,
  },
});