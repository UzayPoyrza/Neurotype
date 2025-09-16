import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Session } from '../types';
import { mockSessions } from '../data/mockData';
import { theme } from '../styles/theme';
import { useStore } from '../store/useStore';

type MeditationDetailStackParamList = {
  MeditationDetail: {
    sessionId: string;
  };
};

type MeditationDetailRouteProp = RouteProp<MeditationDetailStackParamList, 'MeditationDetail'>;
type MeditationDetailNavigationProp = StackNavigationProp<MeditationDetailStackParamList, 'MeditationDetail'>;

interface MeditationDetailScreenProps {}

type TabType = 'summary' | 'history' | 'howto';

export const MeditationDetailScreen: React.FC<MeditationDetailScreenProps> = () => {
  const navigation = useNavigation<MeditationDetailNavigationProp>();
  const route = useRoute<MeditationDetailRouteProp>();
  const { sessionId } = route.params;
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  
  const session = mockSessions.find(s => s.id === sessionId);
  
  if (!session) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Meditation not found</Text>
      </View>
    );
  }

  const getModalityIcon = (modality: string) => {
    const icons: { [key: string]: string } = {
      sound: '🔊',
      movement: '🧘‍♀️',
      mantra: '🕉️',
      visualization: '🌅',
      somatic: '🤲',
      mindfulness: '🧠',
    };
    return icons[modality] || '🧘';
  };

  const getGoalColor = (goal: string) => {
    const colors: { [key: string]: string } = {
      anxiety: '#FF6B6B',
      focus: '#4ECDC4', 
      sleep: '#45B7D1',
    };
    return colors[goal] || theme.colors.primary;
  };

  const renderVisualSection = () => (
    <View style={styles.visualSection}>
      <View style={styles.meditationVisual}>
        <View style={styles.visualContainer}>
          <Text style={styles.visualIcon}>{getModalityIcon(session.modality)}</Text>
          <View style={styles.visualOverlay}>
            <TouchableOpacity style={styles.playButton}>
              <Text style={styles.playIcon}>▶</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderMeditationInfo = () => (
    <View style={styles.meditationInfo}>
      <Text style={styles.meditationTitle}>{session.title}</Text>
      
      <View style={styles.tagsContainer}>
        <View style={[styles.tag, { backgroundColor: getGoalColor(session.goal) }]}>
          <Text style={styles.tagText}>{session.goal}</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{session.modality}</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{session.durationMin} min</Text>
        </View>
      </View>
    </View>
  );

  const renderBenefitsExplanation = () => (
    <View style={styles.benefitsSection}>
      <Text style={styles.benefitsTitle}>Why This Meditation?</Text>
      <Text style={styles.benefitsDescription}>
        {session.whyItWorks || session.description}
      </Text>
      
      <View style={styles.uniqueBenefits}>
        <Text style={styles.uniqueBenefitsTitle}>Unique Benefits</Text>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>🧠</Text>
          <Text style={styles.benefitText}>Enhanced {session.goal === 'anxiety' ? 'calm and relaxation' : session.goal === 'focus' ? 'concentration and clarity' : 'sleep quality'}</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>⚡</Text>
          <Text style={styles.benefitText}>Optimized for {session.modality} practice</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>🎯</Text>
          <Text style={styles.benefitText}>Scientifically proven techniques</Text>
        </View>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return (
          <View style={styles.tabContent}>
            {renderBenefitsExplanation()}
            
            <View style={styles.dataSection}>
              <View style={styles.dataCard}>
                <Text style={styles.dataIcon}>📊</Text>
                <Text style={styles.dataText}>No data yet</Text>
                <Text style={styles.dataSubtext}>Start your first session to see progress</Text>
              </View>
            </View>

            <View style={styles.recordTypeSection}>
              <Text style={styles.recordTypeTitle}>Personal Records</Text>
              <View style={styles.recordTypeButtons}>
                <TouchableOpacity style={[styles.recordTypeButton, styles.recordTypeButtonActive]}>
                  <Text style={styles.recordTypeButtonTextActive}>Best Session</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.recordTypeButton}>
                  <Text style={styles.recordTypeButtonText}>Longest Streak</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.recordTypeButton}>
                  <Text style={styles.recordTypeButtonText}>Total Time</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      
      case 'history':
        return (
          <View style={styles.tabContent}>
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Session History</Text>
              <View style={styles.historyCard}>
                <Text style={styles.historyIcon}>📈</Text>
                <Text style={styles.historyText}>No sessions completed yet</Text>
                <Text style={styles.historySubtext}>Your progress will appear here after your first session</Text>
              </View>
            </View>
          </View>
        );
      
      case 'howto':
        return (
          <View style={styles.tabContent}>
            <View style={styles.howToSection}>
              <Text style={styles.howToTitle}>How to Practice</Text>
              <View style={styles.howToCard}>
                <Text style={styles.howToText}>
                  {session.description}
                </Text>
              </View>
              
              <View style={styles.tipsSection}>
                <Text style={styles.tipsTitle}>Pro Tips</Text>
                <View style={styles.tipItem}>
                  <Text style={styles.tipIcon}>💡</Text>
                  <Text style={styles.tipText}>Find a quiet space free from distractions</Text>
                </View>
                <View style={styles.tipItem}>
                  <Text style={styles.tipIcon}>⏰</Text>
                  <Text style={styles.tipText}>Practice at the same time each day for best results</Text>
                </View>
                <View style={styles.tipItem}>
                  <Text style={styles.tipIcon}>🎧</Text>
                  <Text style={styles.tipText}>Use headphones for immersive audio experience</Text>
                </View>
              </View>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{session.title}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton}>
              <Text style={styles.headerActionText}>↗</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton}>
              <Text style={styles.headerActionText}>⋯</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Tabs in Header */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'summary' && styles.activeTab]}
            onPress={() => setActiveTab('summary')}
          >
            <Text style={[styles.tabText, activeTab === 'summary' && styles.activeTabText]}>
              Summary
            </Text>
            {activeTab === 'summary' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              History
            </Text>
            {activeTab === 'history' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'howto' && styles.activeTab]}
            onPress={() => setActiveTab('howto')}
          >
            <Text style={[styles.tabText, activeTab === 'howto' && styles.activeTabText]}>
              How to
            </Text>
            {activeTab === 'howto' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Visual Section */}
        {renderVisualSection()}
        
        {/* Meditation Info */}
        {renderMeditationInfo()}
        
        {/* Tab Content */}
        {renderTabContent()}
        
        {/* Start Button */}
        <View style={styles.startButtonContainer}>
          <TouchableOpacity 
            style={[styles.startButton, { backgroundColor: getGoalColor(session.goal) }]}
            onPress={() => {
              // Navigate to player screen to start the meditation
              navigation.navigate('Player');
            }}
          >
            <Text style={styles.startButtonText}>Start Meditation</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.health.container.backgroundColor,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.health.container.backgroundColor,
  },
  errorText: {
    color: theme.colors.text.primary,
    fontSize: 18,
  },
  stickyHeader: {
    backgroundColor: theme.health.container.backgroundColor,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 100,
    paddingTop: 44, // Reduced from default SafeAreaView padding
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '400',
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  visualSection: {
    height: 180,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  meditationVisual: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  visualContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualIcon: {
    fontSize: 60,
  },
  visualOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  playIcon: {
    fontSize: 20,
    color: '#ffffff',
    marginLeft: 3,
  },
  meditationInfo: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'transparent',
  },
  meditationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
    textTransform: 'capitalize',
  },
  benefitsSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: 'transparent',
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  benefitsDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text.secondary,
    marginBottom: 20,
  },
  uniqueBenefits: {
    gap: 16,
  },
  uniqueBenefitsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  benefitIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  benefitText: {
    fontSize: 15,
    color: theme.colors.text.primary,
    flex: 1,
    lineHeight: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    // Active tab styling handled by text color
  },
  tabText: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -60,
    width: 120,
    height: 2,
    backgroundColor: '#007AFF',
    borderRadius: 1,
  },
  tabContent: {
    backgroundColor: 'transparent',
    minHeight: 400,
  },
  dataSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  dataCard: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dataIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  dataText: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  dataSubtext: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  recordTypeSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  recordTypeTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  recordTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  recordTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
  },
  recordTypeButtonActive: {
    backgroundColor: '#007AFF',
  },
  recordTypeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  recordTypeButtonTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  historySection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  historyCard: {
    backgroundColor: theme.colors.surface,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  historyIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  historyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  historySubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  howToSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  howToTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  howToCard: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    ...theme.shadows.medium,
  },
  howToText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.primary,
  },
  tipsSection: {
    gap: 12,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    ...theme.shadows.small,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  tipText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    flex: 1,
  },
  startButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'transparent',
  },
  startButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
});