import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Session } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface ExtendedSession extends Session {
  description?: string;
  whyItWorks?: string;
  adaptiveReason?: string;
  isRecommended?: boolean;
}

interface MeditationDetailModalProps {
  session: ExtendedSession | null;
  isVisible: boolean;
  onClose: () => void;
  onStart: () => void;
  onTutorial?: () => void;
}

export const MeditationDetailModal: React.FC<MeditationDetailModalProps> = ({
  session,
  isVisible,
  onClose,
  onStart,
  onTutorial,
}) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, fadeAnim, slideAnim]);

  if (!session) return null;

  const screenHeight = Dimensions.get('window').height;
  const modalHeight = screenHeight * 0.85;

  const getModalityIcon = (modality: string) => {
    const icons: { [key: string]: string } = {
      sound: '🔊',
      movement: '🧘‍♀️',
      mantra: '🕉️',
      visualization: '🌅',
      somatic: '🤲',
      mindfulness: '🧠',
    };
    return icons[modality] || '🧘';
  };

  const getGoalColor = (goal: string) => {
    const colors: { [key: string]: string } = {
      anxiety: '#FF6B6B',
      focus: '#4ECDC4',
      sleep: '#45B7D1',
    };
    return colors[goal] || theme.colors.accent;
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backdropTouchable}
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modal,
            {
              height: modalHeight,
              backgroundColor: theme.colors.surface,
              shadowOpacity: theme.isDark ? 0.3 : 0.06,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [modalHeight, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header with Handle */}
            <View style={styles.header}>
              <View style={[styles.handle, { backgroundColor: theme.colors.surfaceTertiary }]} />
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: theme.colors.surfaceElevated }]}
                onPress={onClose}
              >
                <Text style={[styles.closeButtonText, { color: theme.colors.accent }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Hero Section */}
              <View style={styles.heroSection}>
                <View style={[styles.modalityIcon, { backgroundColor: theme.colors.surfaceElevated }]}>
                  <Text style={styles.modalityIconText}>{getModalityIcon(session.modality)}</Text>
                </View>

                <Text style={[styles.sessionTitle, { color: theme.colors.text.primary }]}>{session.title}</Text>

                <View style={styles.sessionMeta}>
                  <View style={[styles.metaBadge, { backgroundColor: getGoalColor(session.goal) }]}>
                    <Text style={styles.metaBadgeText}>{session.goal}</Text>
                  </View>
                  <Text style={[styles.durationText, { color: theme.colors.text.secondary }]}>{session.durationMin} min</Text>
                  <Text style={[styles.modalityText, { color: theme.colors.text.secondary }]}>{session.modality}</Text>
                </View>

                {session.adaptiveReason && (
                  <View style={[styles.recommendedBadge, { backgroundColor: theme.colors.success }]}>
                    <Text style={styles.recommendedBadgeText}>✨ {session.adaptiveReason}</Text>
                  </View>
                )}
              </View>

              {/* Description Section */}
              {session.description && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Overview</Text>
                  <Text style={[styles.descriptionText, { color: theme.colors.text.primary, backgroundColor: theme.colors.surfaceElevated }]}>
                    {session.description}
                  </Text>
                </View>
              )}

              {/* Why It Works Section */}
              {session.whyItWorks && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>How It Works</Text>
                  <View style={[styles.whyItWorksCard, { backgroundColor: theme.colors.surfaceElevated }]}>
                    <Text style={[styles.whyItWorksText, { color: theme.colors.text.primary }]}>{session.whyItWorks}</Text>
                  </View>
                </View>
              )}

              {/* Benefits Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Benefits</Text>
                <View style={styles.benefitsList}>
                  <View style={[styles.benefitItem, { backgroundColor: theme.colors.surfaceElevated }]}>
                    <Text style={styles.benefitIcon}>🧠</Text>
                    <Text style={[styles.benefitText, { color: theme.colors.text.primary }]}>Improved focus and clarity</Text>
                  </View>
                  <View style={[styles.benefitItem, { backgroundColor: theme.colors.surfaceElevated }]}>
                    <Text style={styles.benefitIcon}>😌</Text>
                    <Text style={[styles.benefitText, { color: theme.colors.text.primary }]}>Reduced stress and anxiety</Text>
                  </View>
                  <View style={[styles.benefitItem, { backgroundColor: theme.colors.surfaceElevated }]}>
                    <Text style={styles.benefitIcon}>💤</Text>
                    <Text style={[styles.benefitText, { color: theme.colors.text.primary }]}>Better sleep quality</Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {onTutorial && (
                  <TouchableOpacity
                    style={[
                      styles.tutorialButton,
                      {
                        backgroundColor: theme.colors.surfaceElevated,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={onTutorial}
                  >
                    <Text style={[styles.tutorialButtonText, { color: theme.colors.accent }]}>Learn More</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.startButton, { backgroundColor: getGoalColor(session.goal) }]}
                  onPress={onStart}
                >
                  <Text style={styles.startButtonText}>Start Practice</Text>
                </TouchableOpacity>
              </View>

              {/* Bottom Spacing */}
              <View style={styles.bottomSpacing} />
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdropTouchable: {
    flex: 1,
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 8,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    marginLeft: 'auto',
    marginRight: 'auto',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  modalityIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalityIconText: {
    fontSize: 32,
  },
  sessionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  metaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  durationText: {
    fontSize: 15,
    fontWeight: '500',
  },
  modalityText: {
    fontSize: 15,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  recommendedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  recommendedBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 17,
    lineHeight: 22,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  whyItWorksCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  whyItWorksText: {
    fontSize: 17,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  benefitText: {
    fontSize: 17,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  tutorialButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tutorialButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  startButton: {
    flex: 2,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  bottomSpacing: {
    height: 40,
  },
});
