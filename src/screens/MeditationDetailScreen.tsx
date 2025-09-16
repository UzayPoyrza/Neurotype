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
  TouchableWithoutFeedback,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Session } from '../types';
import { mockSessions } from '../data/mockData';
import { theme } from '../styles/theme';
import { useStore } from '../store/useStore';
import { ShareIcon } from '../components/icons';
import { PrimaryButton } from '../components/PrimaryButton';
import { DraggableActionBar } from '../components/DraggableActionBar';

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
  const [historySortOrder, setHistorySortOrder] = useState<'latest' | 'earliest'>('latest');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const horizontalScrollRef = useRef<ScrollView>(null);
  const draggableActionBarRef = useRef<any>(null);
  const screenWidth = Dimensions.get('window').width;
  
  const session = mockSessions.find(s => s.id === sessionId);
  
  const handleTabChange = (tab: TabType) => {
    const tabIndex = tab === 'summary' ? 0 : tab === 'history' ? 1 : 2;
    
    // Scroll to the appropriate page
    horizontalScrollRef.current?.scrollTo({
      x: tabIndex * screenWidth,
      animated: true,
    });
    
    setActiveTab(tab);
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    
    // Update scrollX animated value for tab indicator
    scrollX.setValue(offsetX);
    
    const tabIndex = Math.round(offsetX / screenWidth);
    
    // Update active tab based on scroll position
    const newTab = tabIndex === 0 ? 'summary' : tabIndex === 1 ? 'history' : 'howto';
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  };

  const handleScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const maxScrollX = screenWidth * 2; // Maximum scroll position (How-to page)
    
    // Check if we're at the left edge (Summary page) and scrolled beyond it
    if (offsetX < -30) {
      // Navigate back to Today page
      navigation.goBack();
      return;
    }
    
    // Check if we're at the right edge (How-to page) and scrolled beyond it
    if (offsetX > maxScrollX + 30) {
      // Snap back to the How-to page
      horizontalScrollRef.current?.scrollTo({
        x: maxScrollX,
        animated: true,
      });
    }
  };

  const handleMomentumScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    
    // Check if we're at the left edge (Summary page) and scrolled beyond it
    if (offsetX < -30) {
      // Navigate back to Today page
      navigation.goBack();
    }
  };

  const handleVerticalScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    
    // Pass scroll event to DraggableActionBar
    if (draggableActionBarRef.current) {
      draggableActionBarRef.current.handleScroll(scrollY);
    }
  };

  const handleTutorialPress = () => {
    // Navigate to tutorial or show tutorial modal
    console.log('Tutorial pressed for:', session?.title);
    // You can implement tutorial functionality here
  };

  const handleStatsPress = () => {
    // Navigate to stats or show stats modal
    console.log('Stats pressed for:', session?.title);
    // You can implement stats functionality here
  };

  const handleStartPress = () => {
    // Start the meditation session
    console.log('Start pressed for:', session?.title);
    // You can implement start functionality here
    // For example: navigation.navigate('Player', { sessionId: session.id });
  };
  
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
      stress: '#9B59B6',
    };
    return colors[goal] || theme.colors.primary;
  };

  const renderVisualSection = () => (
    <View style={styles.visualSection}>
      <View style={styles.meditationVisual}>
        <View style={styles.visualContainer}>
          <Text style={styles.visualIcon}>{getModalityIcon(session.modality)}</Text>
          <TouchableOpacity style={styles.playButton}>
            <Text style={styles.playIcon}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderMeditationInfo = (showTags = true) => (
    <View style={styles.meditationInfo}>
      <Text style={styles.meditationTitle}>{session.title}</Text>
      
      {showTags && (
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
      )}
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

  const renderSummaryPage = () => (
    <View style={styles.pageContainer}>
      {renderBenefitsExplanation()}
    </View>
  );

  const renderHistoryPage = () => {
    // Check if this is "Gentle Stretching Flow" to show placeholder data
    const showPlaceholderData = session?.title === 'Gentle Stretching Flow';
    
    // Placeholder session data with proper date objects for sorting
    const sessionHistory = showPlaceholderData ? [
      { id: '1', duration: 15, date: 'Dec 15, 2024', time: '2:30 PM', dateObj: new Date('2024-12-15') },
      { id: '2', duration: 12, date: 'Dec 12, 2024', time: '7:15 AM', dateObj: new Date('2024-12-12') },
      { id: '3', duration: 18, date: 'Dec 10, 2024', time: '6:45 PM', dateObj: new Date('2024-12-10') },
      { id: '4', duration: 15, date: 'Dec 8, 2024', time: '8:00 AM', dateObj: new Date('2024-12-08') },
      { id: '5', duration: 20, date: 'Dec 5, 2024', time: '9:30 PM', dateObj: new Date('2024-12-05') },
    ].sort((a, b) => {
      return historySortOrder === 'latest' 
        ? b.dateObj.getTime() - a.dateObj.getTime()
        : a.dateObj.getTime() - b.dateObj.getTime();
    }) : [];
    
    return (
      <ScrollView style={styles.pageContainer} contentContainerStyle={styles.pageContent}>
        <TouchableWithoutFeedback onPress={() => setShowSortOptions(false)}>
          <View style={styles.historySection}>
            {sessionHistory.length > 0 ? (
              <>
                {/* Filter Dropdown */}
                <View style={styles.historyFilterContainer}>
                <TouchableOpacity 
                  style={styles.historyFilterButton}
                  onPress={() => setShowSortOptions(!showSortOptions)}
                >
                  <View style={styles.historyFilterTextContainer}>
                    <Text style={styles.historyFilterButtonText}>
                      {historySortOrder === 'latest' ? (
                        <>
                          <Text style={styles.historyFilterBoldText}>Latest</Text>
                          <Text style={styles.historyFilterArrowText}> → </Text>
                          <Text style={styles.historyFilterLightText}>First</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.historyFilterBoldText}>Earliest</Text>
                          <Text style={styles.historyFilterArrowText}> → </Text>
                          <Text style={styles.historyFilterLightText}>First</Text>
                        </>
                      )}
                    </Text>
                  </View>
                  <Text style={styles.historyFilterArrow}>
                    {showSortOptions ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>
                
                {showSortOptions && (
                  <View style={styles.historyFilterDropdown}>
                    <TouchableOpacity 
                      style={styles.historyFilterOption}
                      onPress={() => {
                        setHistorySortOrder('latest');
                        setShowSortOptions(false);
                      }}
                    >
                      <Text style={[
                        styles.historyFilterOptionText,
                        historySortOrder === 'latest' && styles.historyFilterOptionTextActive
                      ]}>
                        <Text style={styles.historyFilterBoldText}>Latest</Text>
                        <Text style={styles.historyFilterArrowText}> → </Text>
                        <Text style={styles.historyFilterLightText}>First</Text>
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.historyFilterOption}
                      onPress={() => {
                        setHistorySortOrder('earliest');
                        setShowSortOptions(false);
                      }}
                    >
                      <Text style={[
                        styles.historyFilterOptionText,
                        historySortOrder === 'earliest' && styles.historyFilterOptionTextActive
                      ]}>
                        <Text style={styles.historyFilterBoldText}>Earliest</Text>
                        <Text style={styles.historyFilterArrowText}> → </Text>
                        <Text style={styles.historyFilterLightText}>First</Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              
              <View style={styles.historyListContainer}>
              {sessionHistory.map((sessionItem, index) => (
                <View key={sessionItem.id} style={styles.historyCard}>
                  <View style={styles.historyCardContent}>
                    <View style={styles.historyItemLeft}>
                      <View style={styles.historyDurationContainer}>
                        <Text style={styles.historyDurationNumber}>{sessionItem.duration}</Text>
                        <Text style={styles.historyDurationUnit}>min</Text>
                      </View>
                      <Text style={styles.historyItemDate}>{sessionItem.date}</Text>
                    </View>
                    <View style={styles.historyItemRight}>
                      <Text style={styles.historyItemTime}>{sessionItem.time}</Text>
                      <View style={styles.historyStatusDot} />
                    </View>
                  </View>
                </View>
              ))}
              </View>
            </>
          ) : (
            <View style={styles.historyEmptyState}>
              <Text style={styles.historyEmptyIcon}>📊</Text>
              <Text style={styles.historyEmptyText}>No sessions completed</Text>
              <Text style={styles.historyEmptySubtext}>Start your first meditation to see your progress here</Text>
            </View>
          )}
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    );
  };

  const renderHowToPage = () => (
    <View style={styles.pageContainer}>
      <View style={styles.howToSection}>
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>1</Text>
            </View>
            <Text style={styles.instructionText}>Find a quiet, comfortable space</Text>
          </View>
          
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>2</Text>
            </View>
            <Text style={styles.instructionText}>Sit or lie down in a relaxed position</Text>
          </View>
          
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>3</Text>
            </View>
            <Text style={styles.instructionText}>Close your eyes and take a few deep breaths</Text>
          </View>
          
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>4</Text>
            </View>
            <Text style={styles.instructionText}>Focus on your breathing and let go of distractions</Text>
          </View>
          
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>5</Text>
            </View>
            <Text style={styles.instructionText}>Follow the guided meditation instructions</Text>
          </View>
          
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>6</Text>
            </View>
            <Text style={styles.instructionText}>When finished, slowly open your eyes</Text>
          </View>
          
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>7</Text>
            </View>
            <Text style={styles.instructionText}>Take a moment to notice how you feel</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
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
              <ShareIcon 
                onPress={() => {
                  // Handle share functionality
                  console.log('Share meditation:', session.title);
                }}
              />
            </View>
          </View>
          
          {/* Tabs in Header */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'summary' && styles.activeTab]}
              onPress={() => handleTabChange('summary')}
            >
              <Text style={[styles.tabText, activeTab === 'summary' && styles.activeTabText]}>
                Summary
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'history' && styles.activeTab]}
              onPress={() => handleTabChange('history')}
            >
              <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
                History
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'howto' && styles.activeTab]}
              onPress={() => handleTabChange('howto')}
            >
              <Text style={[styles.tabText, activeTab === 'howto' && styles.activeTabText]}>
                How to
              </Text>
            </TouchableOpacity>
            
            {/* Animated Indicator */}
            <Animated.View 
              style={[
                styles.tabIndicator,
                {
                  transform: [{
                    translateX: scrollX.interpolate({
                      inputRange: [0, screenWidth, screenWidth * 2],
                      outputRange: [
                        ((screenWidth - 32) / 3) / 2 - 45, // Center of first tab minus adjusted offset
                        ((screenWidth - 32) / 3) + ((screenWidth - 32) / 3) / 2 - 45, // Center of second tab minus adjusted offset
                        ((screenWidth - 32) / 3) * 2 + ((screenWidth - 32) / 3) / 2 - 45, // Center of third tab minus adjusted offset
                      ],
                      extrapolate: 'clamp',
                    })
                  }]
                }
              ]} 
            />
          </View>
        </View>

        {/* Horizontal ScrollView for pages */}
        <ScrollView
          ref={horizontalScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onScrollEndDrag={handleScrollEnd}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
          style={styles.horizontalScrollView}
          bounces={false}
        >
          {/* Summary Page */}
          <ScrollView 
            style={[styles.page, { width: screenWidth }]} 
            contentContainerStyle={styles.pageContent}
            onScroll={handleVerticalScroll}
            scrollEventThrottle={16}
          >
            {renderVisualSection()}
            {renderMeditationInfo(true)}
            {renderSummaryPage()}
          </ScrollView>
          
          {/* History Page */}
          <ScrollView 
            style={[styles.page, { width: screenWidth }]} 
            contentContainerStyle={styles.pageContent}
            onScroll={handleVerticalScroll}
            scrollEventThrottle={16}
          >
            {renderHistoryPage()}
          </ScrollView>
          
          {/* How To Page */}
          <ScrollView 
            style={[styles.page, { width: screenWidth }]} 
            contentContainerStyle={styles.pageContent}
            onScroll={handleVerticalScroll}
            scrollEventThrottle={16}
          >
            {renderVisualSection()}
            {renderMeditationInfo(false)}
            {renderHowToPage()}
          </ScrollView>
        </ScrollView>
      </SafeAreaView>

      {/* Draggable Action Bar */}
      <DraggableActionBar
        ref={draggableActionBarRef}
        primaryAction={{
          title: "Start",
          icon: "▶",
          onPress: handleStartPress,
        }}
        secondaryAction={{
          title: "Tutorial",
          icon: "📖",
          onPress: handleTutorialPress,
        }}
        themeColor={getGoalColor(session.goal)}
        secondaryColor="#007AFF"
        tabTransitionProgress={scrollX}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.health.container.backgroundColor,
  },
  safeArea: {
    flex: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 100,
    paddingTop: 44, // Status bar height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 24,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '400',
  },
  horizontalScrollView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  pageContent: {
    paddingBottom: 100,
  },
  pageSpacer: {
    height: 20, // Small spacer to account for sticky header
  },
  visualSection: {
    height: 200,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
  },
  meditationVisual: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
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
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 2,
  },
  meditationInfo: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'transparent',
  },
  meditationTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'left',
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
    left: 0,
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
  historyEmptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  historyEmptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  historyEmptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  historyEmptySubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  historyListContainer: {
    gap: 4,
  },
  historyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    ...theme.shadows.small,
  },
  historyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  historyItemLeft: {
    flex: 1,
  },
  historyDurationContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 3,
  },
  historyDurationNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginRight: 4,
  },
  historyDurationUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  historyItemDate: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  historyItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemTime: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    marginRight: 8,
  },
  historyStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  historyFilterContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  historyFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...theme.shadows.small,
  },
  historyFilterTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  historyFilterButtonText: {
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  historyFilterBoldText: {
    fontWeight: '700',
  },
  historyFilterLightText: {
    fontWeight: '400',
  },
  historyFilterArrowText: {
    fontWeight: '500',
  },
  historyFilterArrow: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginLeft: 8,
  },
  historyFilterDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginTop: 0,
    ...theme.shadows.medium,
    zIndex: 1000,
  },
  historyFilterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  historyFilterOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  historyFilterOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  howToSection: {
    paddingHorizontal: 20,
    paddingVertical: 0,
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
  videoContainer: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    ...theme.shadows.medium,
  },
  videoPlaceholder: {
    fontSize: 18,
    color: theme.colors.text.secondary,
  },
  instructionsContainer: {
    gap: 4,
    marginTop: -20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    ...theme.shadows.small,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  instructionNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  instructionText: {
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text.primary,
    flex: 1,
  },
});