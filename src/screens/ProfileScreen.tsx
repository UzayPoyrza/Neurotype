import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
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
import type { Session } from '../types';

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

type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
};

type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

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

  const moduleId = todayModuleId || 'anxiety';
  const activeModule = mentalHealthModules.find(module => module.id === moduleId);
  const moduleBorderColor = activeModule?.color || theme.colors.primary;
  const avatarBackgroundColor = prerenderedModuleBackgrounds[moduleId] || '#f2f2f7';
  const profileInitial = userFirstName?.trim().charAt(0)?.toUpperCase() || 'N';
  const visibleActivityCount = Math.min(recentActivity.length, MAX_VISIBLE_ACTIVITY_ITEMS);
  const activityListMaxHeight = visibleActivityCount * APPROX_ACTIVITY_ROW_HEIGHT;
  const hasScrollableOverflow = recentActivity.length > MAX_VISIBLE_ACTIVITY_ITEMS;
  const [isScrollHintVisible, setIsScrollHintVisible] = React.useState(hasScrollableOverflow);

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
              <Text style={styles.cardTitle}>🎁 Share & Earn</Text>
            </View>
            
            <View style={styles.shareContent}>
              <Text style={styles.shareSubtitle}>
                Give your friends 30 days of premium meditation
              </Text>

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

          <MergedCard.Section style={[styles.mergedSectionAfterDivider, styles.statsSection]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>📊 Your Stats</Text>
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
            <Text style={styles.cardTitle}>📈 Activity History</Text>
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
                <Text style={styles.activitySubtitle}>
                  Recently completed meditations
                </Text>
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

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  shareContent: {
    marginTop: 12,
    gap: 14,
    paddingHorizontal: 16,
  },
  shareSubtitle: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
    marginBottom: 12,
    textAlign: 'center',
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
    marginTop: 12,
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  activitySubtitle: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
    marginBottom: 16,
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
}); 