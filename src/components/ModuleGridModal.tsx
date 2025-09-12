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
  const cardWidth = (width - 48) / 2; // 2 columns with tighter padding

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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'disorder': return '#FF6B6B'; // Red for disorders
      case 'wellness': return '#4ECDC4'; // Teal for wellness
      case 'skill': return '#45B7D1'; // Blue for skills
      default: return '#8e8e93'; // Gray fallback
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Choose Your Journey</Text>
            <Text style={styles.subtitle}>
              Select a mental health focus area for your personalized roadmap
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

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
                  isSelected && styles.selectedCard
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
                  <View style={[styles.selectedBadge, { backgroundColor: '#007AFF' }]}>
                    <Text style={styles.selectedBadgeText}>✓</Text>
                  </View>
                )}

                {/* Module Info */}
                <View style={styles.moduleContent}>
                  <Text style={[styles.moduleTitle, isSelected && styles.selectedTitle]} numberOfLines={2} ellipsizeMode="tail">
                    {module.title}
                  </Text>
                  
                  <Text style={styles.moduleDescription} numberOfLines={2} ellipsizeMode="tail">
                    {module.description}
                  </Text>
                  
                  <View style={styles.moduleFooter}>
                    <Text style={styles.sessionCount}>
                      {module.meditationCount} sessions
                    </Text>
                    
                    <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(module.category) }]}>
                      <Text style={styles.categoryText}>
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
    backgroundColor: theme.health.container.backgroundColor,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  headerContent: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e5ea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  closeText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 15,
    color: '#8e8e93',
    textAlign: 'left',
    marginTop: 0,
    marginBottom: 0,
    fontWeight: '400',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 0,
    borderColor: 'transparent',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    position: 'relative',
    height: 180,
    justifyContent: 'space-between',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  colorIndicator: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  categoryIcon: {
    fontSize: 28,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  selectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    zIndex: 2,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  selectedBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  moduleContent: {
    padding: 12,
    paddingTop: 0,
    flex: 1,
    justifyContent: 'space-between',
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 18,
    height: 36,
  },
  selectedTitle: {
    color: '#007AFF',
  },
  moduleDescription: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 8,
    fontWeight: '400',
    height: 32,
  },
  moduleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionCount: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: '500',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: '#ffffff',
  },
});