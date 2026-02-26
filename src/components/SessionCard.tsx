import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Session } from '../types';
import { theme } from '../styles/theme';
import { useStore } from '../store/useStore';
import { HeartIcon, HeartOutlineIcon } from './icons/PlayerIcons';

interface SessionCardProps {
  session: Session;
  onStart: () => void;
  variant?: 'recommended' | 'list';
  onLike?: (isLiked: boolean, sessionId?: string) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ 
  session, 
  onStart, 
  variant = 'list',
  onLike
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
      case 'mantra':
        return '#ff9500'; // Orange
      default:
        return '#8e8e93'; // Gray
    }
  };

  const getLightBorderColor = (color: string) => {
    // Add opacity to make border lighter (80 = ~50% opacity)
    return color + '80';
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
    const wasFavorited = isFavorited;
    toggleLikedSession(session.id);
    
    // Show message for both like and unlike actions
    if (onLike) {
      onLike(!wasFavorited, session.id); // true if liked, false if unliked, pass sessionId
    }
  };

  const modalityColor = getModalityColor(session.modality);

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
          <View style={[styles.playIcon, { backgroundColor: modalityColor + '15' }]}>
            <Text style={[styles.playIconText, { color: modalityColor }]}>▶</Text>
          </View>
          <View style={styles.sessionInfo}>
            <Text style={styles.title}>{session.title}</Text>
            <View style={styles.metaInfo}>
              <View style={[styles.modalityBadge, styles.modalityBadgeColored, { borderColor: getLightBorderColor(getModalityColor(session.modality)) }]}>
                <Text style={styles.modalityText}>
                  {getModalityIcon(session.modality)} {session.modality}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <TouchableOpacity 
            style={styles.heartButton}
            onPress={handleFavoritePress}
          >
            {isFavorited ? (
              <HeartIcon size={28} color="#ff6b6b" />
            ) : (
              <HeartOutlineIcon size={28} color="#A0A0B0" />
            )}
          </TouchableOpacity>
          <View style={[styles.durationBadge, { backgroundColor: modalityColor }]}>
            <Text style={styles.durationText}>{session.durationMin}m</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1C1C1E',
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderLeftWidth: 4,
    borderLeftColor: '#0A84FF',
  },
  recommendedCard: {
    borderLeftColor: '#34c759',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  listCard: {
    borderLeftColor: '#0A84FF',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  playIconText: {
    fontSize: 14,
    marginLeft: 1,
    fontWeight: '600',
  },
  sessionInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F2F2F7',
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    marginRight: 6,
  },
  modalityBadgeColored: {
    backgroundColor: '#2C2C2E',
  },
  modalityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
    letterSpacing: -0.06,
    color: '#F2F2F7',
  },
  goalText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#A0A0B0',
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
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
}); 