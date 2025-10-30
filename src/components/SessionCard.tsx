import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Session } from '../types';
import { theme } from '../styles/theme';
import { useStore } from '../store/useStore';

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
  const toggleLikedSession = useStore(state => state.toggleLikedSession);
  const likedSessionIds = useStore(state => state.likedSessionIds);
  const isFavorited = likedSessionIds.includes(session.id);

  const getModalityColor = (modality: string) => {
    switch (modality.toLowerCase()) {
      case 'movement':
        return '#ff9500'; // Orange
      case 'somatic':
        return '#34c759'; // Green  
      case 'breathing':
        return '#007aff'; // Blue
      case 'visualization':
        return '#af52de'; // Purple
      case 'mindfulness':
        return '#ff2d92'; // Pink
      default:
        return '#8e8e93'; // Gray
    }
  };

  const getModalityIcon = (modality: string) => {
    switch (modality.toLowerCase()) {
      case 'movement':
        return '🏃';
      case 'somatic':
        return '🧘';
      case 'breathing':
        return '💨';
      case 'visualization':
        return '👁️';
      case 'mindfulness':
        return '🌸';
      default:
        return '🎯';
    }
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation(); // Prevent triggering onStart
    toggleLikedSession(session.id);
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        variant === 'recommended' ? styles.recommendedCard : styles.listCard,
      ]}
      onPress={onStart}
      testID="session-card"
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={styles.playIcon}>
            <Text style={styles.playIconText}>▶</Text>
          </View>
          <View style={styles.sessionInfo}>
            <Text style={styles.title}>{session.title}</Text>
            <View style={styles.metaInfo}>
              <View style={[styles.modalityBadge, { backgroundColor: getModalityColor(session.modality) }]}>
                <Text style={styles.modalityIcon}>{getModalityIcon(session.modality)}</Text>
                <Text style={styles.modalityText}>{session.modality}</Text>
              </View>
              <Text style={styles.goalText}>{session.goal}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <TouchableOpacity 
            style={styles.heartButton}
            onPress={handleFavoritePress}
          >
            <Text style={styles.heartIcon}>
              {isFavorited ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{session.durationMin}m</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 3,
    height: 60,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  recommendedCard: {
    borderLeftColor: '#34c759',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  listCard: {
    borderLeftColor: '#007AFF',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f2f2f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  playIconText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 1,
  },
  sessionInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  modalityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginRight: 6,
  },
  modalityIcon: {
    fontSize: 10,
    marginRight: 2,
  },
  modalityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  goalText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8e8e93',
    textTransform: 'capitalize',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 80,
    position: 'relative',
  },
  heartButton: {
    position: 'absolute',
    right: 44,
    top: -10,
    padding: 6,
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    fontSize: 22,
  },
  durationBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
}); 