import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Session } from '../types';
import { useTheme } from '../contexts/ThemeContext';
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
  const theme = useTheme();
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
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderLeftColor: variant === 'recommended' ? '#34c759' : theme.colors.accent,
        },
        variant === 'recommended' ? styles.recommendedCard : styles.listCard,
      ]}
      onPress={onStart}
      testID="session-card"
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={[styles.playIcon, { backgroundColor: '#007aff15' }]}>
            <Text style={[styles.playIconText, { color: '#007aff' }]}>▶</Text>
          </View>
          <View style={styles.sessionInfo}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>{session.title}</Text>
            <View style={styles.metaInfo}>
              <View
                style={[
                  styles.modalityBadge,
                  { backgroundColor: modalityColor + '12' },
                ]}
              >
                <Text style={[styles.modalityText, { color: modalityColor }]}>
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
              <HeartOutlineIcon size={28} color={theme.colors.text.secondary} />
            )}
          </TouchableOpacity>
          <View style={[styles.durationBadge, { backgroundColor: '#007aff' }]}>
            <Text style={styles.durationText}>{session.durationMin}m</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
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
    borderLeftWidth: 4,
  },
  recommendedCard: {
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  listCard: {},
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
    paddingVertical: 3,
    borderRadius: 10,
  },
  modalityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
    letterSpacing: -0.06,
  },
  goalText: {
    fontSize: 12,
    fontWeight: '400',
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
