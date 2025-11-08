import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Svg, { Path } from 'react-native-svg';
import { useStore, prerenderedModuleBackgrounds } from '../store/useStore';
import { theme } from '../styles/theme';
import { SubscriptionBadge } from '../components/SubscriptionBadge';
import { mentalHealthModules } from '../data/modules';

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
        <View style={styles.mergedCard}>
          <View style={styles.mergedSection}>
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
          </View>

          <View style={styles.mergedDivider} />

          <View style={[styles.mergedSection, styles.statsSection]}>
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
          </View>
        </View>

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
                  Your recent meditation sessions and progress
                </Text>
                <View style={styles.activityList}>
                  {recentActivity.map((session, index) => {
                    const improvement = session.before - session.after;
                    const date = new Date(session.date);
                    const formattedDate = date.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    });
                    
                    return (
                      <View key={index} style={styles.activityItem}>
                        <View style={[
                          styles.activityIcon, 
                          { backgroundColor: improvement > 0 ? '#34c759' : '#ff9500' }
                        ]}>
                          <Text style={styles.activityEmoji}>
                            {improvement > 0 ? '✨' : '🌱'}
                          </Text>
                        </View>
                        <View style={styles.activityInfo}>
                          <View style={styles.activityHeader}>
                            <Text style={styles.activityTitle}>Meditation Session</Text>
                            <Text style={styles.activityDate}>{formattedDate}</Text>
                          </View>
                          <View style={styles.activityDetails}>
                            <Text style={styles.activityMeta}>
                              Anxiety: {session.before} → {session.after} 
                              {improvement > 0 && (
                                <Text style={styles.improvementText}> (-{improvement.toFixed(1)})</Text>
                              )}
                            </Text>
                          </View>
                        </View>
                        <View style={[
                          styles.improvementBadge,
                          { backgroundColor: improvement > 0 ? '#e8f5e8' : '#fff3e0' }
                        ]}>
                          <Text style={[
                            styles.improvementBadgeText,
                            { color: improvement > 0 ? '#34c759' : '#ff9500' }
                          ]}>
                            {improvement > 0 ? `↓${improvement.toFixed(1)}` : '→'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
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
  mergedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  mergedSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  mergedDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  statsSection: {
    backgroundColor: '#fafafa',
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
    marginTop: 16,
    gap: 20,
  },
  shareSubtitle: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
    marginBottom: 20,
    textAlign: 'center',
  },
  stepsList: {
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    marginBottom: 20,
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
    paddingVertical: 12,
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
    paddingVertical: 12,
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
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
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
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 18,
  },
  activityInfo: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  activityDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityMeta: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '400',
  },
  improvementText: {
    color: '#34c759',
    fontWeight: '600',
  },
  improvementBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 12,
  },
  improvementBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 