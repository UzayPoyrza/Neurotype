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
import { useTheme } from '../contexts/ThemeContext';

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

const { width } = Dimensions.get('window');
const iconSize = (width - 80) / 6; // 6 icons per row with padding

export const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({
  visible,
  onClose,
  onSelectIcon,
  currentIcon,
}) => {
  const theme = useTheme();

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
      <View style={[styles.overlay, { paddingHorizontal: theme.spacing.lg }]}>
        <View style={[
          styles.modalContainer,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borders.radius.xl,
            borderWidth: theme.borders.width.thick,
            borderColor: theme.colors.primary,
            ...theme.shadows.medium,
          },
        ]}>
          {/* Header */}
          <View style={[
            styles.header,
            {
              paddingHorizontal: theme.spacing.xl,
              paddingVertical: theme.spacing.lg,
              borderBottomWidth: theme.borders.width.normal,
              borderBottomColor: theme.colors.primary,
            },
          ]}>
            <Text style={[
              styles.title,
              {
                fontSize: theme.typography.sizes.xl,
                fontWeight: theme.typography.weights.semibold,
                color: theme.colors.primary,
                fontFamily: theme.typography.fontFamily,
              },
            ]}>
              Choose Profile Picture
            </Text>
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  borderRadius: theme.borders.radius.md,
                  backgroundColor: theme.colors.background,
                  borderWidth: theme.borders.width.normal,
                  borderColor: theme.colors.primary,
                  ...theme.shadows.small,
                },
              ]}
              onPress={onClose}
            >
              <Text style={[
                styles.closeText,
                {
                  fontSize: theme.typography.sizes.md,
                  fontWeight: theme.typography.weights.bold,
                  color: theme.colors.primary,
                },
              ]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Icon Grid */}
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={[styles.iconGrid, { padding: theme.spacing.lg }]}>
              {profileIcons.map((icon, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.iconOption,
                    {
                      width: iconSize,
                      height: iconSize,
                      borderRadius: iconSize / 2,
                      backgroundColor: theme.colors.background,
                      borderWidth: theme.borders.width.normal,
                      borderColor: theme.colors.primary,
                      marginBottom: theme.spacing.md,
                      ...theme.shadows.small,
                    },
                    currentIcon === icon && {
                      backgroundColor: theme.colors.success,
                      borderWidth: theme.borders.width.thick,
                    },
                  ]}
                  onPress={() => handleSelectIcon(icon)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.iconText, { fontSize: iconSize * 0.5 }]}>{icon}</Text>
                  {currentIcon === icon && (
                    <View style={[
                      styles.selectedIndicator,
                      {
                        backgroundColor: theme.colors.primary,
                        borderWidth: theme.borders.width.normal,
                        borderColor: theme.colors.surface,
                      },
                    ]}>
                      <Text style={[
                        styles.selectedText,
                        {
                          fontSize: theme.typography.sizes.xs,
                          fontWeight: theme.typography.weights.bold,
                          color: theme.colors.surface,
                        },
                      ]}>
                        ✓
                      </Text>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    maxHeight: '80%',
    width: '100%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    // font values applied inline
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    // font values applied inline
  },
  scrollContainer: {
    maxHeight: 400,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  iconOption: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconText: {
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    // font values applied inline
  },
});
