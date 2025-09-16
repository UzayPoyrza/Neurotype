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
  const scrollY = useRef(new Animated.Value(0)).current;
  
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

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [-50, 0],
    extrapolate: 'clamp',
  });

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
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <SafeAreaView>
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
        </SafeAreaView>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Visual Section */}
        {renderVisualSection()}
        
        {/* Meditation Info */}
        {renderMeditationInfo()}
        
        {/* Tabs */}
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
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(242, 242, 247, 0.95)',
    backdropFilter: 'blur(10px)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionText: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  visualSection: {
    height: 300,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meditationVisual: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.health.container.backgroundColor,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...theme.shadows.medium,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  playIcon: {
    fontSize: 24,
    color: theme.colors.text.onPrimary,
    marginLeft: 4,
  },
  meditationInfo: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: 'transparent',
  },
  meditationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    textTransform: 'capitalize',
  },
  benefitsSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: 'transparent',
  },
  benefitsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  benefitsDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.secondary,
    marginBottom: 24,
  },
  uniqueBenefits: {
    gap: 16,
  },
  uniqueBenefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    ...theme.shadows.small,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    // Active tab styling handled by text color
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -15,
    width: 30,
    height: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
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
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  dataIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  dataText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  dataSubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  recordTypeSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  recordTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  recordTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  recordTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  recordTypeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  recordTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  recordTypeButtonTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.onPrimary,
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
    paddingVertical: 24,
    backgroundColor: 'transparent',
  },
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.onPrimary,
  },
});