import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useStore } from '../store/useStore';
import { theme } from '../styles/theme';
import { ProfilePictureModal } from '../components/ProfilePictureModal';
import { SubscriptionBadge } from '../components/SubscriptionBadge';
import { UserIcon, SettingsIcon } from '../components/icons';

type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
};

type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { 
    userProgress,
    profileIcon,
    setProfileIcon,
    subscriptionType
  } = useStore();
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  
  const [modalVisible, setModalVisible] = useState(false);

    // Get recent activity from session deltas
  const recentActivity = userProgress.sessionDeltas.slice(-10).reverse(); // Last 10 sessions, most recent first

  return (
    <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <SubscriptionBadge 
              subscriptionType={subscriptionType}
              size="small"
            />
            <Text style={styles.title}>Profile</Text>
            <SettingsIcon 
              size={32}
              onPress={() => navigation.navigate('Settings')}
            />
          </View>
        </View>

        {/* Profile Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>👤 Your Profile</Text>
          </View>
          
          <View style={styles.profileContent}>
            <TouchableOpacity
              style={styles.profilePictureContainer}
              onPress={() => setModalVisible(true)}
            >
              <UserIcon 
                size={80}
                profileIcon={profileIcon}
                onPress={() => setModalVisible(true)}
              />
              <Text style={styles.changePhotoText}>Tap to change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Share & Earn Card */}
        <View style={styles.card}>
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

            <View style={styles.rewardSection}>
              <Text style={styles.rewardTitle}>🌟 Your Reward</Text>
              <Text style={styles.rewardDescription}>
                Earn premium credits and exclusive content for each friend who joins!
              </Text>
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

        {/* Stats Card */}
        <View style={styles.card}>
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
      
      {/* Profile Picture Modal */}
      <ProfilePictureModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelectIcon={setProfileIcon}
        currentIcon={profileIcon}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  ...theme.health, // Use global Apple Health styles
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    alignItems: 'center',
  },
  profilePictureContainer: {
    alignItems: 'center',
  },
  changePhotoText: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '400',
    marginTop: 8,
  },
  shareContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
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
  rewardSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  rewardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  rewardDescription: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
    lineHeight: 20,
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