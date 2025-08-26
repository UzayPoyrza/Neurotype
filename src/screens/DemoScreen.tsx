import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { InstagramStyleScreen } from '../components/InstagramStyleScreen';
import { theme } from '../styles/theme';

export const DemoScreen: React.FC = () => {
  return (
    <InstagramStyleScreen title="Instagram Style Demo">
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Instagram-Style Navigation</Text>
          <Text style={styles.headerSubtitle}>
            Scroll down to see the RevealBar hide, scroll up to see it show
          </Text>
        </View>

        {/* Test Content */}
        {Array.from({ length: 20 }, (_, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardTitle}>Section {index + 1}</Text>
            <Text style={styles.cardText}>
              This is test content to demonstrate the Instagram-style navigation behavior. 
              The RevealBar should slide under the TopShell during scroll, with 1:1 movement 
              and snap behavior when scrolling stops.
            </Text>
            <View style={styles.cardMeta}>
              <Text style={styles.cardMetaText}>Scroll position: {index + 1}</Text>
            </View>
          </View>
        ))}

        {/* Bottom Content */}
        <View style={styles.bottomCard}>
          <Text style={styles.bottomTitle}>Bottom of Content</Text>
          <Text style={styles.bottomText}>
            When you reach the bottom and scroll down, the RevealBar should stay hidden. 
            When you scroll up from the bottom, the RevealBar should show.
            This demonstrates the fixed bottom behavior.
          </Text>
        </View>
      </View>
    </InstagramStyleScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    ...theme.common.content,
  },
  header: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.lg,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginBottom: 10,
    fontFamily: theme.typography.fontFamily,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.secondary,
    lineHeight: 20,
    fontFamily: theme.typography.fontFamily,
  },
  card: {
    ...theme.common.card,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    marginBottom: 10,
    fontFamily: theme.typography.fontFamily,
  },
  cardText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.secondary,
    lineHeight: 20,
    marginBottom: 15,
    fontFamily: theme.typography.fontFamily,
  },
  cardMeta: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.disabled,
  },
  cardMetaText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.secondary,
    fontFamily: theme.typography.fontFamily,
  },
  bottomCard: {
    ...theme.common.card,
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.primary,
  },
  bottomTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginBottom: 10,
    fontFamily: theme.typography.fontFamily,
  },
  bottomText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.primary,
    lineHeight: 20,
    fontFamily: theme.typography.fontFamily,
  },
}); 