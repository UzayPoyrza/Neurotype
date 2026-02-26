import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Modal } from 'react-native';
import { Session } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface SessionBottomSheetProps {
  session: Session | null;
  isVisible: boolean;
  onClose: () => void;
  onStart: () => void;
}

export const SessionBottomSheet: React.FC<SessionBottomSheetProps> = ({
  session,
  isVisible,
  onClose,
  onStart,
}) => {
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, slideAnim, backdropAnim]);

  if (!session) return null;

  const screenHeight = Dimensions.get('window').height;
  const sheetHeight = screenHeight * 0.4;

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
              opacity: backdropAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backdropTouchable}
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              height: sheetHeight,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
              shadowOpacity: theme.isDark ? 0.3 : 0.06,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [sheetHeight, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: theme.colors.secondary }]} />

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamily }]}>
              {session.title}
            </Text>

            <View style={[
              styles.metaContainer,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.lg,
              }
            ]}>
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: theme.colors.text.secondary, fontFamily: theme.typography.fontFamily }]}>
                  Duration
                </Text>
                <Text style={[styles.metaValue, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamily }]}>
                  {session.durationMin} minutes
                </Text>
              </View>

              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: theme.colors.text.secondary, fontFamily: theme.typography.fontFamily }]}>
                  Type
                </Text>
                <Text style={[styles.metaValue, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamily }]}>
                  {session.modality}
                </Text>
              </View>

              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: theme.colors.text.secondary, fontFamily: theme.typography.fontFamily }]}>
                  Focus
                </Text>
                <Text style={[styles.metaValue, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamily }]}>
                  {session.goal}
                </Text>
              </View>
            </View>

            <View style={[
              styles.description,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.lg,
              }
            ]}>
              <Text style={[styles.descriptionText, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamily }]}>
                A guided {session.modality} session designed to help with {session.goal}.{' '}
                Take {session.durationMin} minutes to focus on your wellbeing.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.startButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.md,
                  shadowColor: theme.colors.shadow,
                  shadowOpacity: theme.isDark ? 0.3 : 0.06,
                },
              ]}
              onPress={onStart}
            >
              <Text style={[styles.startButtonText, { color: theme.colors.text.onPrimary, fontFamily: theme.typography.fontFamily }]}>
                Start Session
              </Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 2,
    borderBottomWidth: 0,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    opacity: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    borderWidth: 1,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  description: {
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
