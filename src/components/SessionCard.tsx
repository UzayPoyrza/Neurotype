import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Session } from '../types';
import { theme } from '../styles/theme';

interface SessionCardProps {
  session: Session;
  onStart: () => void;
  variant?: 'recommended' | 'list';
}

export const SessionCard: React.FC<SessionCardProps> = ({ 
  session, 
  onStart, 
  variant = 'list' 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        variant === 'recommended' ? styles.recommendedCard : styles.listCard,
      ]}
      onPress={onStart}
      testID="session-card"
    >
      <View style={styles.header}>
        <Text style={styles.title}>{session.title}</Text>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{session.durationMin}m</Text>
        </View>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Modality:</Text>
          <Text style={styles.detailValue}>{session.modality}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Goal:</Text>
          <Text style={styles.detailValue}>{session.goal}</Text>
        </View>
      </View>
      
      <View style={styles.actionButton}>
        <Text style={styles.actionText}>Start Session</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    ...theme.common.card,
  },
  recommendedCard: {
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
  },
  listCard: {
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
    flex: 1,
  },
  durationBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    borderColor: theme.colors.primary,
  },
  durationText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  details: {
    marginBottom: theme.spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.secondary,
    fontFamily: theme.typography.fontFamily,
    width: 80,
  },
  detailValue: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
    textTransform: 'capitalize',
  },
  actionButton: {
    ...theme.common.button,
  },
  actionText: {
    ...theme.common.buttonText,
  },
}); 