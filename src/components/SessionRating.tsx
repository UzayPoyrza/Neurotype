import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface SessionRatingProps {
  onSubmit: (rating: number) => void;
  onCancel: () => void;
}

export const SessionRating: React.FC<SessionRatingProps> = ({
  onSubmit,
  onCancel,
}) => {
  const theme = useTheme();
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
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamily }]}>
          How was your session?
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary, fontFamily: theme.typography.fontFamily }]}>
          Rate your experience to help us personalize your journey
        </Text>

        {/* Rating Scale */}
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <TouchableOpacity
              key={rating}
              style={[
                styles.ratingButton,
                {
                  backgroundColor: selectedRating === rating ? theme.colors.primary : theme.colors.background,
                  borderColor: selectedRating === rating ? theme.colors.primary : theme.colors.border,
                  borderRadius: 25,
                  shadowColor: theme.colors.shadow,
                  shadowOpacity: selectedRating === rating ? (theme.isDark ? 0.3 : 0.12) : (theme.isDark ? 0.3 : 0.06),
                  shadowRadius: selectedRating === rating ? 4 : 2,
                  elevation: selectedRating === rating ? 4 : 2,
                },
              ]}
              onPress={() => handleRatingSelect(rating)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.ratingNumber,
                  {
                    color: selectedRating === rating ? theme.colors.text.onPrimary : theme.colors.text.primary,
                    fontFamily: theme.typography.fontFamily,
                  },
                ]}
              >
                {rating}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rating Description */}
        {selectedRating && (
          <View style={[
            styles.ratingDescription,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.lg,
            }
          ]}>
            <Text style={[styles.ratingText, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamily }]}>
              {getRatingText(selectedRating)}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.cancelButton,
              {
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.lg,
              }
            ]}
            onPress={onCancel}
          >
            <Text style={[styles.cancelButtonText, { color: theme.colors.text.secondary, fontFamily: theme.typography.fontFamily }]}>
              Skip
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: selectedRating === null ? theme.colors.disabled : theme.colors.primary,
                borderColor: selectedRating === null ? theme.colors.disabled : theme.colors.primary,
                borderRadius: theme.borderRadius.lg,
                shadowColor: theme.colors.shadow,
                shadowOpacity: theme.isDark ? 0.3 : 0.06,
              },
            ]}
            onPress={handleSubmit}
            disabled={selectedRating === null}
          >
            <Text
              style={[
                styles.submitButtonText,
                {
                  color: selectedRating === null ? theme.colors.disabledText : theme.colors.text.onPrimary,
                  fontFamily: theme.typography.fontFamily,
                },
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
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
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
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 1, height: 1 },
  },
  ratingNumber: {
    fontSize: 18,
    fontWeight: '600',
  },
  ratingDescription: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 40,
    borderWidth: 1,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    alignItems: 'center',
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
