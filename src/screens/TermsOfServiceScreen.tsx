import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';

interface TermsOfServiceScreenProps {
  onClose: () => void;
}

export const TermsOfServiceScreen: React.FC<TermsOfServiceScreenProps> = ({ onClose }) => {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.content}>
          [PLACEHOLDER - Add your Terms of Service content here]
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consumer Health Data</Text>
          
          <Text style={styles.paragraph}>
            By using Neurotype, you acknowledge that the app collects and processes consumer health data as described in our Privacy Policy. You consent to the collection, use, and processing of your health data for the purposes of providing personalized meditation recommendations and tracking your wellness progress.
          </Text>

          <Text style={styles.subsectionTitle}>Your Responsibilities</Text>
          <Text style={styles.paragraph}>
            You are responsible for:
          </Text>
          <Text style={styles.bulletPoint}>• Providing accurate information about your health conditions and preferences</Text>
          <Text style={styles.bulletPoint}>• Keeping your account secure to protect your health data</Text>
          <Text style={styles.bulletPoint}>• Understanding that Neurotype is not a substitute for professional medical advice, diagnosis, or treatment</Text>

          <Text style={styles.subsectionTitle}>Limitations</Text>
          <Text style={styles.paragraph}>
            Neurotype is designed to support your mental wellness journey but is not intended to diagnose, treat, cure, or prevent any medical condition. Always seek the advice of qualified health providers with any questions you may have regarding a medical condition.
          </Text>

          <Text style={styles.subsectionTitle}>Data Rights</Text>
          <Text style={styles.paragraph}>
            You have rights regarding your consumer health data as outlined in our Privacy Policy. By using Neurotype, you agree to our data practices as described in the Privacy Policy, including our handling of consumer health data.
          </Text>
        </View>
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
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
    marginTop: 8,
  },
  subsectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginTop: 20,
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

