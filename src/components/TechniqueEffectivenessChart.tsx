import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TechniqueEffectiveness } from '../types';
import { theme } from '../styles/theme';

interface TechniqueEffectivenessChartProps {
  techniques: TechniqueEffectiveness[];
}

export const TechniqueEffectivenessChart: React.FC<TechniqueEffectivenessChartProps> = ({
  techniques,
}) => {
  // Sort techniques by effectiveness (highest first, then "Haven't tried yet" at the bottom)
  const sortedTechniques = [...techniques].sort((a, b) => {
    if (a.effectiveness === null && b.effectiveness === null) return 0;
    if (a.effectiveness === null) return 1; // Haven't tried goes to bottom
    if (b.effectiveness === null) return -1;
    return b.effectiveness - a.effectiveness; // Highest effectiveness first
  });

  const getBarColor = (effectiveness: number | null) => {
    if (effectiveness === null) return '#e0e0e0';
    if (effectiveness >= 80) return '#4CAF50'; // Green for high effectiveness
    if (effectiveness >= 60) return '#8BC34A'; // Light green for good effectiveness
    if (effectiveness >= 40) return '#FFC107'; // Yellow for moderate effectiveness
    return '#FF5722'; // Red for low effectiveness
  };

  const renderBar = (technique: TechniqueEffectiveness, index: number) => {
    const barWidth = technique.effectiveness === null ? 20 : technique.effectiveness;
    const barColor = getBarColor(technique.effectiveness);
    
    return (
      <View key={technique.techniqueId} style={styles.techniqueRow}>
        <View style={styles.techniqueInfo}>
          <Text style={styles.techniqueName}>{technique.techniqueName}</Text>
          <Text style={styles.effectivenessText}>
            {technique.effectiveness === null 
              ? 'Haven\'t tried yet' 
              : `${technique.effectiveness}%`
            }
          </Text>
        </View>
        <View style={styles.barContainer}>
          <View 
            style={[
              styles.bar, 
              { 
                width: `${barWidth}%`, 
                backgroundColor: barColor 
              }
            ]} 
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Most Effective Techniques</Text>
      <View style={styles.chartContainer}>
        {sortedTechniques.map((technique, index) => renderBar(technique, index))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  chartContainer: {
    gap: 12,
  },
  techniqueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  techniqueInfo: {
    flex: 1,
    marginRight: 12,
  },
  techniqueName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  effectivenessText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  barContainer: {
    width: 100,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
});