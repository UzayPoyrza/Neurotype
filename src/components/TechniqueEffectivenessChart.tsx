import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { TechniqueEffectiveness } from '../types';
import { theme } from '../styles/theme';
import { InfoBox } from './InfoBox';

interface TechniqueEffectivenessChartProps {
  techniques: TechniqueEffectiveness[];
}

export const TechniqueEffectivenessChart: React.FC<TechniqueEffectivenessChartProps> = ({
  techniques,
}) => {
  const [showInfoBox, setShowInfoBox] = useState(false);
  const [infoButtonActive, setInfoButtonActive] = useState(false);
  const infoButtonRef = useRef<View>(null);

  // Sort techniques by effectiveness (highest first, then "Haven't tried yet" at the bottom)
  const sortedTechniques = [...techniques].sort((a, b) => {
    if (a.effectiveness === null && b.effectiveness === null) return 0;
    if (a.effectiveness === null) return 1; // Haven't tried goes to bottom
    if (b.effectiveness === null) return -1;
    return b.effectiveness - a.effectiveness; // Highest effectiveness first
  });

  const getBarColor = (effectiveness: number | null) => {
    if (effectiveness === null) return '#2C2C2E';
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

  const handleInfoPress = () => {
    setShowInfoBox(true);
    setInfoButtonActive(true);
  };

  const handleCloseInfoBox = () => {
    setShowInfoBox(false);
    setInfoButtonActive(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Most Effective Techniques</Text>
        <TouchableOpacity
          ref={infoButtonRef}
          style={[styles.infoButton, infoButtonActive && styles.infoButtonActive]}
          onPress={handleInfoPress}
        >
          <Text style={[styles.infoButtonText, infoButtonActive && styles.infoButtonTextActive]}>i</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chartContainer}>
        {sortedTechniques.map((technique, index) => renderBar(technique, index))}
      </View>

      <InfoBox
        isVisible={showInfoBox}
        onClose={handleCloseInfoBox}
        title="How Effectiveness is Calculated"
        content="Effectiveness is calculated based on the improvement in your mood scores before and after each meditation session. Techniques that consistently show greater improvements (larger before-to-after score differences) are rated as more effective for you personally."
        position={{ top: 40, right: 16 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F2F2F7',
    flex: 1,
  },
  infoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  infoButtonActive: {
    backgroundColor: '#0A84FF',
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0A0B0',
  },
  infoButtonTextActive: {
    color: '#ffffff',
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
    color: '#F2F2F7',
    marginBottom: 2,
  },
  effectivenessText: {
    fontSize: 12,
    color: '#A0A0B0',
    fontWeight: '500',
  },
  barContainer: {
    width: 100,
    height: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
});