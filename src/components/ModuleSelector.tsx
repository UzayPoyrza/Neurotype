import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MentalHealthModule } from '../data/modules';
import { theme } from '../styles/theme';

interface ModuleSelectorProps {
  modules: MentalHealthModule[];
  selectedModuleId: string;
  onModuleSelect: (moduleId: string) => void;
}

export const ModuleSelector: React.FC<ModuleSelectorProps> = ({
  modules,
  selectedModuleId,
  onModuleSelect,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {modules.map(module => {
          const isSelected = module.id === selectedModuleId;
          return (
            <TouchableOpacity
              key={module.id}
              style={[
                styles.moduleTab,
                isSelected && styles.selectedTab,
                { borderBottomColor: module.color },
              ]}
              onPress={() => onModuleSelect(module.id)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.moduleIndicator,
                { backgroundColor: module.color },
                isSelected && styles.selectedIndicator,
              ]} />
              
              <Text style={[
                styles.moduleTitle,
                isSelected && styles.selectedTitle,
              ]}>
                {module.title}
              </Text>
              
              <Text style={[
                styles.meditationCount,
                isSelected && styles.selectedCount,
              ]}>
                {module.meditationCount} sessions
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: theme.borders.width.normal,
    borderBottomColor: theme.colors.border,
    paddingVertical: 8,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  moduleTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: theme.borderRadius.lg,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    minWidth: 100,
    backgroundColor: 'transparent',
  },
  selectedTab: {
    backgroundColor: theme.colors.background,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.border,
    borderBottomWidth: 3,
  },
  moduleIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
    opacity: 0.6,
  },
  selectedIndicator: {
    opacity: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  moduleTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily,
  },
  selectedTitle: {
    color: theme.colors.text.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  meditationCount: {
    fontSize: 9,
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontFamily: theme.typography.fontFamily,
    opacity: 0.7,
  },
  selectedCount: {
    opacity: 1,
    fontWeight: '500',
  },
});