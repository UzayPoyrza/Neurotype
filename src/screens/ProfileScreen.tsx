import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore, prerenderedModuleBackgrounds, createSubtleBackground } from '../store/useStore';
import { theme } from '../styles/theme';
import { SubscriptionBadge } from '../components/SubscriptionBadge';
import { mentalHealthModules } from '../data/modules';
import type { MentalHealthModule } from '../data/modules';
import { MergedCard } from '../components/MergedCard';
import { mockSessions } from '../data/mockData';
import type { Session, EmotionalFeedbackLabel } from '../types';
import { InfoBox } from '../components/InfoBox';

const MAX_VISIBLE_ACTIVITY_ITEMS = 4;
const APPROX_ACTIVITY_ROW_HEIGHT = 84;

const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) {
    return text;
  }

  const trimmed = text.slice(0, maxLength).trimEnd();
  return `${trimmed}...`;
};

const formatSessionDate = (rawDate?: string): string | null => {
  if (!rawDate) {
    return null;
  }

  const hasTimeComponent = rawDate.includes('T');
  const parsedDate = new Date(hasTimeComponent ? rawDate : `${rawDate}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  if (hasTimeComponent) {
    const datePart = parsedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const timePart = parsedDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${datePart} at ${timePart}`;
  }

  return parsedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const feedbackColorMap: Record<EmotionalFeedbackLabel, string> = {
  Bad: '#ff4757',
  Meh: '#ffa502',
  Okay: '#ffd700',
  Good: '#2ed573',
  Great: '#1e90ff',
};

const formatTimestamp = (timestampSeconds: number): string => {
  const minutes = Math.floor(timestampSeconds / 60);
  const seconds = Math.max(0, Math.floor(timestampSeconds % 60));
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
};

type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

type TouchableOpacityRef = React.ComponentRef<typeof TouchableOpacity>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { 
    userProgress,
    subscriptionType
  } = useStore();
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  const setCurrentScreen = useStore(state => state.setCurrentScreen);
  const userFirstName = useStore(state => state.userFirstName);
  const todayModuleId = useStore(state => state.todayModuleId);
  const emotionalFeedbackHistory = useStore(state => state.emotionalFeedbackHistory);
  const removeEmotionalFeedbackEntry = useStore(state => state.removeEmotionalFeedbackEntry);

  const sessionsById = React.useMemo(() => {
    return mockSessions.reduce<Record<string, Session>>((acc, session) => {
      acc[session.id] = session;
      return acc;
    }, {});
  }, []);

  const modulesById = React.useMemo(() => {
    return mentalHealthModules.reduce<Record<string, MentalHealthModule>>((acc, module) => {
      acc[module.id] = module;
      return acc;
    }, {});
  }, []);

  // Set screen context when component mounts
  React.useEffect(() => {
    setCurrentScreen('profile');
  }, [setCurrentScreen]);

    // Get recent activity from session deltas
  const recentActivity = userProgress.sessionDeltas.slice(-10).reverse(); // Last 10 sessions, most recent first
  const sortedFeedbackHistory = React.useMemo(() => {
    return [...emotionalFeedbackHistory].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [emotionalFeedbackHistory]);

  const moduleId = todayModuleId || 'anxiety';
  const activeModule = mentalHealthModules.find(module => module.id === moduleId);
  const moduleBorderColor = activeModule?.color || theme.colors.primary;
  const avatarBackgroundColor = prerenderedModuleBackgrounds[moduleId] || '#f2f2f7';
  const profileInitial = userFirstName?.trim().charAt(0)?.toUpperCase() || 'N';
  const visibleActivityCount = Math.min(recentActivity.length, MAX_VISIBLE_ACTIVITY_ITEMS);
  const activityListMaxHeight = visibleActivityCount * APPROX_ACTIVITY_ROW_HEIGHT;
  const hasScrollableOverflow = recentActivity.length > MAX_VISIBLE_ACTIVITY_ITEMS;
  const [isScrollHintVisible, setIsScrollHintVisible] = React.useState(hasScrollableOverflow);
  const visibleFeedbackCount = Math.min(sortedFeedbackHistory.length, MAX_VISIBLE_ACTIVITY_ITEMS);
  const feedbackListMaxHeight = visibleFeedbackCount * APPROX_ACTIVITY_ROW_HEIGHT;
  const hasFeedbackOverflow = sortedFeedbackHistory.length > MAX_VISIBLE_ACTIVITY_ITEMS;
  const [isFeedbackScrollHintVisible, setIsFeedbackScrollHintVisible] = React.useState(hasFeedbackOverflow);
  const [showFeedbackInfoBox, setShowFeedbackInfoBox] = React.useState(false);
  const [isFeedbackInfoActive, setIsFeedbackInfoActive] = React.useState(false);
  const [feedbackInfoPosition, setFeedbackInfoPosition] = React.useState<{ top: number; right: number }>({
    top: 120,
    right: 20,
  });
  const feedbackInfoButtonRef = React.useRef<TouchableOpacityRef | null>(null);

  React.useEffect(() => {
    if (!hasScrollableOverflow) {
      setIsScrollHintVisible(false);
    } else {
      setIsScrollHintVisible(true);
    }
  }, [hasScrollableOverflow]);

  const handleActivityScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!hasScrollableOverflow) {
        return;
      }

      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
      const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 8;

      if (isAtBottom && isScrollHintVisible) {
        setIsScrollHintVisible(false);
      } else if (!isAtBottom && !isScrollHintVisible) {
        setIsScrollHintVisible(true);
      }
    },
    [hasScrollableOverflow, isScrollHintVisible]
  );

  React.useEffect(() => {
    if (!hasFeedbackOverflow) {
      setIsFeedbackScrollHintVisible(false);
    } else {
      setIsFeedbackScrollHintVisible(true);
    }
  }, [hasFeedbackOverflow]);

  const handleFeedbackScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!hasFeedbackOverflow) {
        return;
      }

      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
      const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 8;

      if (isAtBottom && isFeedbackScrollHintVisible) {
        setIsFeedbackScrollHintVisible(false);
      } else if (!isAtBottom && !isFeedbackScrollHintVisible) {
        setIsFeedbackScrollHintVisible(true);
      }
    },
    [hasFeedbackOverflow, isFeedbackScrollHintVisible]
  );

  const INFO_BOX_VERTICAL_GAP = 0;

  const handleFeedbackInfoPress = React.useCallback(() => {
    setIsFeedbackInfoActive(true);
    const buttonInstance = feedbackInfoButtonRef.current;
    if (buttonInstance && typeof (buttonInstance as any).measureInWindow === 'function') {
      (buttonInstance as any).measureInWindow((x: number, y: number, width: number, height: number) => {
        const windowWidth = Dimensions.get('window').width;
        const margin = 16;
        const calculatedTop = Math.max(margin, y + height + INFO_BOX_VERTICAL_GAP);
        const calculatedRight = Math.max(margin, windowWidth - (x + width));
        setFeedbackInfoPosition({
          top: calculatedTop,
          right: calculatedRight,
        });
        setShowFeedbackInfoBox(true);
      });
    } else {
      setShowFeedbackInfoBox(true);
    }
  }, []);

  const handleCloseFeedbackInfoBox = React.useCallback(() => {
    setShowFeedbackInfoBox(false);
    setIsFeedbackInfoActive(false);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
      {/* Sticky Header */}
      <View style={[styles.stickyHeader, { backgroundColor: globalBackgroundColor }]}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <Svg width={29} height={29} viewBox="0 0 24 24" fill="none">
            {/* Outer gear */}
            <Path
              d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
              stroke="#000000"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
              stroke="#000000"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Profile Header Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.profileHeaderContent}>
            <View style={styles.profilePictureWrapper}>
              <View
                style={[
                  styles.profileInitialContainer,
                  {
                    borderColor: moduleBorderColor,
                    backgroundColor: avatarBackgroundColor,
                  }
                ]}
              >
                <Text style={[styles.profileInitialText, { color: moduleBorderColor }]}>
                  {profileInitial}
                </Text>
              </View>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Your Profile</Text>
              <View style={styles.subscriptionContainer}>
                <SubscriptionBadge 
                  subscriptionType={subscriptionType}
                  size="medium"
                />
              </View>
              <Text style={styles.profileSubtitle}>
                {subscriptionType === 'premium' 
                  ? 'Premium member with full access' 
                  : 'Basic member - upgrade for more features'
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Share & Stats Merged Card */}
        <MergedCard>
          <MergedCard.Section style={styles.mergedSectionTop}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderTop}>
                <Text style={styles.cardTitle}>🎁 Share & Earn</Text>
              </View>
              <Text style={styles.shareSubtitle}>
                Give your friends 30 days of premium meditation
              </Text>
            </View>
            
            <View style={styles.shareContent}>

              <View style={styles.stepsList}>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>Share your unique referral link</Text>
                </View>
                
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>Friend downloads and signs up</Text>
                </View>
                
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>They get 30 days of premium free!</Text>
                </View>
              </View>

              <View style={styles.referralSection}>
                <Text style={styles.referralLabel}>Your referral link:</Text>
                <View style={styles.referralLinkContainer}>
                  <Text style={styles.referralLink}>neurotype.app/ref/user123</Text>
                  <TouchableOpacity style={styles.copyButton}>
                    <Text style={styles.copyButtonText}>Copy</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.shareButton}>
                  <Text style={styles.shareButtonText}>📱 Share Link</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.inviteButton}>
                  <Text style={styles.inviteButtonText}>✉️ Send Invite</Text>
                </TouchableOpacity>
              </View>
            </View>
          </MergedCard.Section>

          <MergedCard.Section style={[styles.mergedSectionAfterDivider, styles.statsSection]} hideDividerBefore>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderTop}>
                <Text style={styles.cardTitle}>📊 Your Stats</Text>
              </View>
            </View>
            
            <View style={styles.statsContent}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Friends Invited</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Credits Earned</Text>
              </View>
            </View>
          </MergedCard.Section>
        </MergedCard>

        {/* Activity History Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderTop}>
              <Text style={styles.cardTitle}>📈 Activity History</Text>
            </View>
            {recentActivity.length > 0 && (
              <Text style={styles.activitySubtitle}>
                Recently completed meditations
              </Text>
            )}
          </View>
          
          <View style={styles.activityContent}>
            {recentActivity.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>🧘‍♀️</Text>
                <Text style={styles.emptyStateTitle}>No sessions yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Start your meditation journey today! Your completed sessions will appear here.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.activityListWrapper}>
                  <ScrollView
                    style={[
                      styles.activityListScroll,
                      { maxHeight: activityListMaxHeight },
                      hasScrollableOverflow && styles.activityListScrollWithIndicator
                    ]}
                    contentContainerStyle={[
                      styles.activityList,
                      hasScrollableOverflow && styles.activityListScrollableContent
                    ]}
                    showsVerticalScrollIndicator={hasScrollableOverflow}
                    nestedScrollEnabled
                    onScroll={handleActivityScroll}
                    scrollEventThrottle={16}
                  >
                    {recentActivity.map((sessionDelta, index) => {
                      const sessionData = sessionDelta.sessionId ? sessionsById[sessionDelta.sessionId] : undefined;
                      const moduleData =
                        (sessionDelta.moduleId && modulesById[sessionDelta.moduleId]) ||
                        (sessionData ? modulesById[sessionData.goal] : undefined);
                      const moduleTitle = moduleData?.title;
                      const moduleColor = moduleData?.color || '#007AFF';
                      const moduleInitial = moduleTitle?.trim().charAt(0)?.toUpperCase() || 'M';
                      const iconBackground = createSubtleBackground(moduleColor);
                      const formattedDate = formatSessionDate(sessionDelta.date);
                      const sessionTitle = sessionData?.title || 'Meditation Session';
                      const truncatedTitle = truncateText(sessionTitle, 28);
                      const durationMinutes = sessionData?.durationMin ?? null;
                      const durationLabel = durationMinutes !== null ? `${durationMinutes} min` : '-- min';
                      const completionLabel = formattedDate ? `Completed ${formattedDate}` : 'Completion date unavailable';

                      return (
                        <View key={`${sessionDelta.date}-${index}`} style={styles.activityItem}>
                          <View
                            style={[
                              styles.activityIcon,
                              { backgroundColor: iconBackground }
                            ]}
                          >
                            <Text style={[styles.activityIconText, { color: moduleColor }]}>
                              {moduleInitial}
                            </Text>
                          </View>
                          <View style={styles.activityInfo}>
                            <View style={styles.activityHeader}>
                              <Text
                                style={styles.activityTitle}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {truncatedTitle}
                              </Text>
                              <Text style={styles.activityDate}>
                                {completionLabel}
                              </Text>
                            </View>
                            <View style={styles.activityDetails}>
                              {moduleTitle ? (
                                <Text style={styles.activityMeta}>{moduleTitle}</Text>
                              ) : null}
                            </View>
                          </View>
                          <View
                            style={[
                              styles.durationBadge,
                              { backgroundColor: iconBackground }
                            ]}
                          >
                            <Text style={[styles.durationBadgeText, { color: moduleColor }]}>
                              {durationLabel}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                  {hasScrollableOverflow && (
                    <>
                      <LinearGradient
                        pointerEvents="none"
                        colors={['rgba(248,249,250,1)', 'rgba(248,249,250,0)']}
                        style={styles.scrollFadeTop}
                      />
                      <LinearGradient
                        pointerEvents="none"
                        colors={['rgba(248,249,250,0)', 'rgba(248,249,250,1)']}
                        style={styles.scrollFadeBottom}
                      />
                      <View pointerEvents="none" style={styles.scrollHintContainer}>
                        <Text
                          style={[
                            styles.scrollHintText,
                            !isScrollHintVisible && styles.scrollHintTextHidden
                          ]}
                        >
                          Scroll to see more
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </>
            )}
          </View>
        </View>

        {/* Emotional Feedback History Card */}
        <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderTop}>
            <Text style={styles.cardTitle}>💬 Emotional Feedback History</Text>
            <TouchableOpacity
              ref={feedbackInfoButtonRef}
              style={[styles.infoButton, isFeedbackInfoActive && styles.infoButtonActive]}
              onPress={handleFeedbackInfoPress}
              activeOpacity={0.7}
            >
              <Text style={[styles.infoButtonText, isFeedbackInfoActive && styles.infoButtonTextActive]}>
                i
              </Text>
            </TouchableOpacity>
          </View>
          {sortedFeedbackHistory.length > 0 && (
            <Text style={styles.activitySubtitle}>
              Moments you captured during sessions
            </Text>
          )}
        </View>

          <View style={styles.activityContent}>
            {sortedFeedbackHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>🎯</Text>
                <Text style={styles.emptyStateTitle}>No feedback yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Share how each meditation makes you feel to see it here.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.activityListWrapper}>
                  <ScrollView
                    style={[
                      styles.activityListScroll,
                      { maxHeight: feedbackListMaxHeight },
                      hasFeedbackOverflow && styles.activityListScrollWithIndicator
                    ]}
                    contentContainerStyle={[
                      styles.activityList,
                      hasFeedbackOverflow && styles.activityListScrollableContent
                    ]}
                    showsVerticalScrollIndicator={hasFeedbackOverflow}
                    nestedScrollEnabled
                    onScroll={handleFeedbackScroll}
                    scrollEventThrottle={16}
                  >
                    {sortedFeedbackHistory.map(entry => {
                      const sessionData = sessionsById[entry.sessionId];
                      const sessionTitle = sessionData?.title || 'Meditation Session';
                      const truncatedTitle = truncateText(sessionTitle, 28);
                      const feedbackLabel = entry.label;
                      const feedbackColor = feedbackColorMap[feedbackLabel];
                      const feedbackBackground = feedbackColor;
                      const formattedDate = formatSessionDate(entry.date) || 'Date unavailable';
                      const formattedTimestamp = formatTimestamp(entry.timestampSeconds);

                      return (
                        <View key={entry.id} style={styles.activityItem}>
                          <View
                            style={[
                              styles.activityIcon,
                              { backgroundColor: feedbackBackground, borderWidth: 0 }
                            ]}
                          />
                          <View style={styles.activityInfo}>
                            <View style={styles.activityHeader}>
                              <Text
                                style={styles.activityTitle}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {truncatedTitle}
                              </Text>
                              <Text style={styles.activityDate}>{formattedDate}</Text>
                            </View>
                            <View style={styles.feedbackDetailsRow}>
                              <Text
                                style={[
                                  styles.feedbackLabelTag,
                                  {
                                    color: '#ffffff',
                                    backgroundColor: feedbackColor
                                  }
                                ]}
                              >
                                {feedbackLabel}
                              </Text>
                              <Text style={styles.activityMeta}>at {formattedTimestamp}</Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.deleteFeedbackButton}
                            onPress={() => removeEmotionalFeedbackEntry(entry.id)}
                            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                          >
                            <Text style={styles.deleteFeedbackButtonText}>×</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </ScrollView>
                  {hasFeedbackOverflow && (
                    <>
                      <LinearGradient
                        pointerEvents="none"
                        colors={['rgba(248,249,250,1)', 'rgba(248,249,250,0)']}
                        style={styles.scrollFadeTop}
                      />
                      <LinearGradient
                        pointerEvents="none"
                        colors={['rgba(248,249,250,0)', 'rgba(248,249,250,1)']}
                        style={styles.scrollFadeBottom}
                      />
                      <View pointerEvents="none" style={styles.scrollHintContainer}>
                        <Text
                          style={[
                            styles.scrollHintText,
                            !isFeedbackScrollHintVisible && styles.scrollHintTextHidden
                          ]}
                        >
                          Scroll to see more
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </>
            )}
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      <InfoBox
        isVisible={showFeedbackInfoBox}
        onClose={handleCloseFeedbackInfoBox}
        title="Emotional Feedback"
        content="Warning: deleting feedback may change the suggestion algorithm."
        position={feedbackInfoPosition}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  ...theme.health, // Use global Apple Health styles
  stickyHeader: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 5,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollContent: {
    paddingTop: 120, // Account for shorter sticky header height (same as other pages)
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  profileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  profilePictureWrapper: {
    marginRight: 20,
  },
  profileInitialContainer: {
    width: 110,
    height: 110,
    borderRadius: 24,
    borderWidth: theme.borders.width.thick,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
    borderColor: theme.colors.primary,
    backgroundColor: '#f2f2f7',
  },
  profileInitialText: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  statsSection: {
    backgroundColor: '#ffffff',
  },
  mergedSectionTop: {
    paddingTop: 0,
  },
  mergedSectionAfterDivider: {
    paddingTop: 0,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subscriptionContainer: {
    marginBottom: 8,
  },
  profileSubtitle: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
    lineHeight: 20,
  },
  profileContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    alignItems: 'center',
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shareContent: {
    paddingTop: 0,
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  shareSubtitle: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
    marginBottom: 0,
    textAlign: 'left',
  },
  stepsList: {
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    fontWeight: '400',
  },
  referralSection: {
    marginBottom: 16,
  },
  referralLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  referralLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  referralLink: {
    flex: 1,
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
  },
  copyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  inviteButton: {
    flex: 1,
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '400',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  activityContent: {
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  activitySubtitle: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
    marginTop: 0,
    marginBottom: 0,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  activityList: {
    gap: 12,
  },
  activityListScrollableContent: {
    paddingBottom: 36,
  },
  activityListScroll: {
    width: '100%',
    marginRight: -4,
  },
  activityListScrollWithIndicator: {
    paddingRight: 8,
    marginRight: -12,
  },
  activityListWrapper: {
    position: 'relative',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  activityIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  activityInfo: {
    flex: 1,
    paddingRight: 8,
  },
  activityHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  activityDate: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '400',
    marginTop: 2,
  },
  activityDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  activityMeta: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '400',
  },
  durationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
    alignSelf: 'flex-start',
  },
  durationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  feedbackDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackLabelTag: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    color: '#ffffff',
  },
  deleteFeedbackButton: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteFeedbackButtonText: {
    fontSize: 18,
    color: '#8e8e93',
    fontWeight: '600',
  },
  scrollFadeTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 24,
  },
  scrollFadeBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 32,
    height: 32,
  },
  scrollHintContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  scrollHintText: {
    fontSize: 11,
    color: '#8e8e93',
    fontWeight: '500',
  },
  scrollHintTextHidden: {
    opacity: 0,
  },
  infoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  infoButtonActive: {
    backgroundColor: '#007AFF',
  },
  infoButtonTextActive: {
    color: '#ffffff',
  },
}); 