import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  Dimensions 
} from 'react-native';
import { MentalHealthModule } from '../data/modules';
import { theme } from '../styles/theme';

interface ModuleGridModalProps {
  modules: MentalHealthModule[];
  selectedModuleId: string;
  isVisible: boolean;
  onModuleSelect: (moduleId: string) => void;
  onClose: () => void;
}

export const ModuleGridModal: React.FC<ModuleGridModalProps> = ({
  modules,
  selectedModuleId,
  isVisible,
  onModuleSelect,
  onClose,
}) => {
  const { width } = Dimensions.get('window');
  const cardWidth = (width - 60) / 2; // 2 columns with padding

  const handleModuleSelect = (moduleId: string) => {
    onModuleSelect(moduleId);
    onClose();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'disorder': return '🧠';
      case 'wellness': return '🌱';
      case 'skill': return '⚡';
      default: return '🔹';
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Choose Your Journey</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Select a mental health focus area for your personalized roadmap
        </Text>

        {/* Module Grid */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        >
          {modules.map((module) => {
            const isSelected = module.id === selectedModuleId;
            
            return (
              <TouchableOpacity
                key={module.id}
                style={[
                  styles.moduleCard,
                  { width: cardWidth },
                  isSelected && styles.selectedCard,
                  { borderColor: module.color }
                ]}
                onPress={() => handleModuleSelect(module.id)}
                activeOpacity={0.8}
              >
                {/* Module Color Indicator */}
                <View style={[styles.colorIndicator, { backgroundColor: module.color }]}>
                  <Text style={styles.categoryIcon}>
                    {getCategoryIcon(module.category)}
                  </Text>
                </View>

                {/* Selected Badge */}
                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: module.color }]}>
                    <Text style={styles.selectedBadgeText}>✓</Text>
                  </View>
                )}

                {/* Module Info */}
                <View style={styles.moduleContent}>
                  <Text style={[styles.moduleTitle, isSelected && styles.selectedTitle]}>
                    {module.title}
                  </Text>
                  
                  <Text style={styles.moduleDescription} numberOfLines={2}>
                    {module.description}
                  </Text>
                  
                  <View style={styles.moduleFooter}>
                    <Text style={styles.sessionCount}>
                      {module.meditationCount} sessions
                    </Text>
                    
                    <View style={[styles.categoryBadge, { backgroundColor: `${module.color}20` }]}>
                      <Text style={[styles.categoryText, { color: module.color }]}>
                        {module.category}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: theme.borders.width.normal,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.border,
  },
  closeText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
    fontFamily: theme.typography.fontFamily,
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moduleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borders.width.thick,
    marginBottom: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedCard: {
    borderWidth: 3,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  colorIndicator: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
    zIndex: 1,
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
  moduleContent: {
    padding: 16,
    paddingTop: 0,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily,
  },
  selectedTitle: {
    color: theme.colors.primary,
  },
  moduleDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
    fontFamily: theme.typography.fontFamily,
  },
  moduleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionCount: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
    fontFamily: theme.typography.fontFamily,
  },
});