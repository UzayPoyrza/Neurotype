import React, { useState } from 'react';
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
  const [pressedCard, setPressedCard] = useState<string | null>(null);

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
      case 'skill': return '#9B59B6'; // Purple for skills
      default: return '#8e8e93'; // Gray fallback
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Convert hex color to rgba with opacity
  const hexToRgba = (hex: string, opacity: number) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return `rgba(0, 0, 0, ${opacity})`;
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
                  isSelected && styles.selectedCard,
                  pressedCard === module.id && styles.pressedCard
                ]}
                onPress={() => handleModuleSelect(module.id)}
                onPressIn={() => setPressedCard(module.id)}
                onPressOut={() => setPressedCard(null)}
                activeOpacity={1}
              >
                {/* Gradient Background Overlay */}
                <View style={[styles.gradientOverlay, { backgroundColor: hexToRgba(module.color, 0.08) }]} />
                
                {/* Module Icon */}
                <View style={[styles.iconContainer, { backgroundColor: module.color }]}>
                  <Text style={styles.categoryIcon}>
                    {getCategoryIcon(module.category)}
                  </Text>
                </View>

                {/* Selected Indicator */}
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <View style={[styles.selectedDot, { backgroundColor: module.color }]} />
                  </View>
                )}

                {/* Module Info */}
                <View style={styles.moduleContent}>
                  <Text 
                    style={[
                      styles.moduleTitle, 
                      isSelected && styles.selectedTitle
                    ]} 
                    numberOfLines={2} 
                    ellipsizeMode="tail"
                  >
                    {module.title}
                  </Text>
                  
                  <Text 
                    style={styles.moduleDescription} 
                    numberOfLines={3} 
                    ellipsizeMode="tail"
                  >
                    {module.description}
                  </Text>

                  {/* Category Badge */}
                  <View style={styles.categoryContainer}>
                    <View style={[
                      styles.categoryBadge, 
                      { backgroundColor: hexToRgba(getCategoryColor(module.category), 0.12) }
                    ]}>
                      <Text style={[
                        styles.categoryText,
                        { color: getCategoryColor(module.category) }
                      ]}>
                        {getCategoryLabel(module.category)}
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
    paddingBottom: 20,
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
    marginBottom: 6,
    letterSpacing: -0.5,
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
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#f2f2f7',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    position: 'relative',
    height: 200,
    justifyContent: 'flex-start',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  pressedCard: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    fontSize: 28,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  moduleContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flex: 1,
    justifyContent: 'flex-start',
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  selectedTitle: {
    color: '#007AFF',
  },
  moduleDescription: {
    fontSize: 13,
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '400',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  categoryContainer: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: -2,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});