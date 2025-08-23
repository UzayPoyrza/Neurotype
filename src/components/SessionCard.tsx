import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Session } from '../types';
import { Chip } from './Chip';
import { PrimaryButton } from './PrimaryButton';

interface SessionCardProps {
  session: Session;
  onStart: (session: Session) => void;
  variant?: 'recommended' | 'list';
}

export const SessionCard: React.FC<SessionCardProps> = ({ 
  session, 
  onStart, 
  variant = 'list' 
}) => {
  const isRecommended = variant === 'recommended';
  
  return (
    <View style={[
      styles.card,
      isRecommended ? styles.recommendedCard : styles.listCard
    ]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[
            styles.title,
            isRecommended ? styles.recommendedTitle : styles.listTitle
          ]}>
            {session.title}
          </Text>
          <Text style={styles.duration}>
            {session.durationMin} min
          </Text>
        </View>
        {isRecommended && (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>
              Recommended
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.chipsContainer}>
        <Chip 
          label={session.modality.charAt(0).toUpperCase() + session.modality.slice(1)} 
          variant="modality"
        />
        <Chip 
          label={session.goal.charAt(0).toUpperCase() + session.goal.slice(1)} 
          variant="goal"
        />
      </View>
      
      <PrimaryButton
        title="Start"
        testID={isRecommended ? "start-session" : "start-from-explore"}
        onPress={() => onStart(session)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  recommendedCard: {
    marginBottom: 16,
  },
  listCard: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontWeight: '600',
    color: '#111827',
  },
  recommendedTitle: {
    fontSize: 20,
  },
  listTitle: {
    fontSize: 18,
  },
  duration: {
    color: '#6b7280',
    marginTop: 4,
  },
  recommendedBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  recommendedText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '500',
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
}); 