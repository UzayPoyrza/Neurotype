import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';

interface ConsumerHealthDataPrivacyScreenProps {
  onClose: () => void;
}

export const ConsumerHealthDataPrivacyScreen: React.FC<ConsumerHealthDataPrivacyScreenProps> = ({ onClose }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consumer Health Data Privacy</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.content}>
          Neurotype collects and processes certain health-related information to provide you with personalized meditation recommendations and track your wellness progress. This section explains how we handle your consumer health data.
        </Text>

        <Text style={styles.sectionTitle}>What Health Data We Collect</Text>
        <Text style={styles.paragraph}>
          We may collect the following types of consumer health data:
        </Text>
        <Text style={styles.bulletPoint}>• Mental health conditions you select (e.g., anxiety, depression, ADHD)</Text>
        <Text style={styles.bulletPoint}>• Meditation session completion data and frequency</Text>
        <Text style={styles.bulletPoint}>• Self-reported emotional states and ratings (before/after meditation)</Text>
        <Text style={styles.bulletPoint}>• Progress tracking data (streaks, session effectiveness)</Text>
        <Text style={styles.bulletPoint}>• Preferences related to meditation modalities and techniques</Text>

        <Text style={styles.sectionTitle}>How We Use Your Health Data</Text>
        <Text style={styles.paragraph}>
          We use your consumer health data solely to:
        </Text>
        <Text style={styles.bulletPoint}>• Provide personalized meditation recommendations</Text>
        <Text style={styles.bulletPoint}>• Track your progress and show you insights about your meditation practice</Text>
        <Text style={styles.bulletPoint}>• Improve our recommendation algorithms</Text>
        <Text style={styles.bulletPoint}>• Deliver the core functionality of the Neurotype app</Text>

        <Text style={styles.sectionTitle}>How We Protect Your Health Data</Text>
        <Text style={styles.paragraph}>
          We implement industry-standard security measures to protect your consumer health data, including encryption, secure data storage, and access controls. We do not sell your health data to third parties.
        </Text>

        <Text style={styles.sectionTitle}>Your Rights Regarding Health Data</Text>
        <Text style={styles.paragraph}>
          You have the right to:
        </Text>
        <Text style={styles.bulletPoint}>• Access your consumer health data</Text>
        <Text style={styles.bulletPoint}>• Request deletion of your consumer health data</Text>
        <Text style={styles.bulletPoint}>• Request a copy of your consumer health data</Text>
        <Text style={styles.bulletPoint}>• Withdraw consent for processing your health data</Text>
        <Text style={styles.paragraph}>
          To exercise these rights, please contact us through the app settings or at the contact information provided in our Privacy Policy.
        </Text>

        <Text style={styles.sectionTitle}>Data Sharing and Third Parties</Text>
        <Text style={styles.paragraph}>
          We do not share your consumer health data with third parties except as necessary to provide our services (e.g., cloud storage providers) or as required by law. We require all service providers to maintain the same level of protection for your health data.
        </Text>

        <Text style={styles.sectionTitle}>Compliance</Text>
        <Text style={styles.paragraph}>
          We comply with applicable health data privacy laws, including but not limited to state consumer health data privacy laws and regulations that may apply to your jurisdiction.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000000',
    fontWeight: '400',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000000',
    fontWeight: '400',
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000000',
    fontWeight: '400',
    marginLeft: 8,
    marginBottom: 8,
  },
});

