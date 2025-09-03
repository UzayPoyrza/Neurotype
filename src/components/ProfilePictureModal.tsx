import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { theme } from '../styles/theme';

interface ProfilePictureModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectIcon: (icon: string) => void;
  currentIcon: string;
}

const profileIcons = [
  '👤', '😊', '😎', '🤓', '🧘', '🌟', '🎯', '💡',
  '🚀', '🎨', '🎵', '📚', '🌈', '⚡', '🔥', '💎',
  '🌙', '☀️', '🌸', '🍃', '🦋', '🐨', '🐱', '🐶',
  '🦊', '🐼', '🦉', '🐧', '🦄', '🐝', '🐢', '🦋'
];

export const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({
  visible,
  onClose,
  onSelectIcon,
  currentIcon,
}) => {
  const handleSelectIcon = (icon: string) => {
    onSelectIcon(icon);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Choose Profile Picture</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Icon Grid */}
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.iconGrid}>
              {profileIcons.map((icon, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.iconOption,
                    currentIcon === icon && styles.selectedIcon
                  ]}
                  onPress={() => handleSelectIcon(icon)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.iconText}>{icon}</Text>
                  {currentIcon === icon && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');
const iconSize = (width - 80) / 6; // 6 icons per row with padding

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.xl,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: theme.borders.width.normal,
    borderBottomColor: theme.colors.primary,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borders.radius.md,
    backgroundColor: theme.colors.background,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  closeText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  scrollContainer: {
    maxHeight: 400,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  iconOption: {
    width: iconSize,
    height: iconSize,
    borderRadius: iconSize / 2,
    backgroundColor: theme.colors.background,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
    position: 'relative',
  },
  selectedIcon: {
    backgroundColor: theme.colors.success,
    borderWidth: theme.borders.width.thick,
  },
  iconText: {
    fontSize: iconSize * 0.5,
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.surface,
  },
  selectedText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
  },
});