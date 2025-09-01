import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useStore } from '../store/useStore';
import { theme } from '../styles/theme';
import { InstagramStyleScreen } from '../components/InstagramStyleScreen';
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
    profileIcon,
    setProfileIcon,
    subscriptionType
  } = useStore();
  
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <InstagramStyleScreen 
      title={
        <UserIcon 
          size={40}
          profileIcon={profileIcon}
          onPress={() => setModalVisible(true)}
        />
      }
      showBackButton={false}
      leftComponent={
        <SubscriptionBadge 
          subscriptionType={subscriptionType}
          size="small"
        />
      }
      rightComponent={
        <SettingsIcon 
          size={40}
          onPress={() => navigation.navigate('Settings')}
        />
      }
    >
      <View style={styles.content}>
        {/* Affiliate Program */}
        <View style={styles.affiliateContainer}>
          {/* Header */}
          <View style={styles.affiliateHeader}>
            <Text style={styles.affiliateEmoji}>🎁</Text>
            <Text style={styles.affiliateTitle}>Share & Earn</Text>
            <Text style={styles.affiliateSubtitle}>Give your friends 30 days of premium meditation</Text>
          </View>

          {/* Main Card */}
          <View style={styles.affiliateCard}>
            <View style={styles.benefitSection}>
              <Text style={styles.benefitTitle}>How it works:</Text>
              
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
            </View>

            <View style={styles.rewardSection}>
              <Text style={styles.rewardTitle}>🌟 Your Reward</Text>
              <Text style={styles.rewardDescription}>
                For every friend who joins, you'll earn premium credits and exclusive meditation content!
              </Text>
            </View>

            {/* Referral Link */}
            <View style={styles.referralSection}>
              <Text style={styles.referralLabel}>Your referral link:</Text>
              <View style={styles.referralLinkContainer}>
                <Text style={styles.referralLink}>neurotype.app/ref/user123</Text>
                <TouchableOpacity style={styles.copyButton}>
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.shareButton}>
                <Text style={styles.shareButtonText}>📱 Share Link</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.inviteButton}>
                <Text style={styles.inviteButtonText}>✉️ Send Invite</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.affiliateStats}>
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

          {/* Activity History */}
          <View style={styles.activitySection}>
            <Text style={styles.activityTitle}>Activity History</Text>
            <Text style={styles.activitySubtitle}>
              Looks like you don't have anything in your history just yet. Want to start with a mini-meditation?
            </Text>

            <View style={styles.meditationsList}>
              <TouchableOpacity style={styles.meditationItem}>
                <View style={[styles.meditationIcon, { backgroundColor: '#FF8C42' }]}>
                  <Text style={styles.meditationEmoji}>😌</Text>
                </View>
                <View style={styles.meditationInfo}>
                  <View style={styles.meditationHeader}>
                    <Text style={styles.lockIcon}>🔒</Text>
                    <Text style={styles.meditationTitle}>Breathe</Text>
                  </View>
                  <View style={styles.meditationDetails}>
                    <Text style={styles.soundIcon}>🔊</Text>
                    <Text style={styles.meditationMeta}>Meditation • 1-3 min</Text>
                  </View>
                </View>
                <Text style={styles.arrowIcon}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.meditationItem}>
                <View style={[styles.meditationIcon, { backgroundColor: '#4CAF50' }]}>
                  <Text style={styles.meditationEmoji}>🧘</Text>
                </View>
                <View style={styles.meditationInfo}>
                  <View style={styles.meditationHeader}>
                    <Text style={styles.lockIcon}>🔒</Text>
                    <Text style={styles.meditationTitle}>Body Scan</Text>
                  </View>
                  <View style={styles.meditationDetails}>
                    <Text style={styles.soundIcon}>🔊</Text>
                    <Text style={styles.meditationMeta}>Meditation • 1-3 min</Text>
                  </View>
                </View>
                <Text style={styles.arrowIcon}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.meditationItem}>
                <View style={[styles.meditationIcon, { backgroundColor: '#2196F3' }]}>
                  <Text style={styles.meditationEmoji}>🌊</Text>
                </View>
                <View style={styles.meditationInfo}>
                  <View style={styles.meditationHeader}>
                    <Text style={styles.lockIcon}>🔒</Text>
                    <Text style={styles.meditationTitle}>Unwind</Text>
                  </View>
                  <View style={styles.meditationDetails}>
                    <Text style={styles.soundIcon}>🔊</Text>
                    <Text style={styles.meditationMeta}>Meditation • 1-3 min</Text>
                  </View>
                </View>
                <Text style={styles.arrowIcon}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      
      {/* Profile Picture Modal */}
      <ProfilePictureModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelectIcon={setProfileIcon}
        currentIcon={profileIcon}
      />
    </InstagramStyleScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    ...theme.common.content,
  },
  affiliateContainer: {
    flex: 1,
  },
  affiliateHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
  },
  affiliateEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  affiliateTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
  },
  affiliateSubtitle: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.secondary,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
    lineHeight: 24,
  },
  affiliateCard: {
    ...theme.common.card,
    marginBottom: theme.spacing.xxxl,
    padding: theme.spacing.xl,
  },
  benefitSection: {
    marginBottom: theme.spacing.xl,
  },
  benefitTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.fontFamily,
  },
  stepsList: {
    gap: theme.spacing.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    ...theme.shadows.small,
  },
  stepNumberText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
    fontFamily: theme.typography.fontFamily,
  },
  stepText: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.secondary,
    fontFamily: theme.typography.fontFamily,
    lineHeight: 20,
  },
  rewardSection: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borders.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.xl,
  },
  rewardTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily,
  },
  rewardDescription: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.secondary,
    fontFamily: theme.typography.fontFamily,
    lineHeight: 20,
  },
  referralSection: {
    marginBottom: theme.spacing.xl,
  },
  referralLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily,
  },
  referralLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.small,
  },
  referralLink: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.secondary,
    fontFamily: theme.typography.fontFamily,
  },
  copyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borders.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    ...theme.shadows.small,
  },
  copyButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
    fontFamily: theme.typography.fontFamily,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  shareButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borders.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  shareButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
    fontFamily: theme.typography.fontFamily,
  },
  inviteButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  inviteButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  affiliateStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.lg,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.xl,
    ...theme.shadows.medium,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily,
  },
  statLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.secondary,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
  },
  statDivider: {
    width: 2,
    height: 40,
    backgroundColor: theme.colors.primary,
  },
  activitySection: {
    marginTop: theme.spacing.xxxl,
  },
  activityTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.fontFamily,
  },
  activitySubtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.secondary,
    fontFamily: theme.typography.fontFamily,
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  meditationsList: {
    gap: theme.spacing.lg,
  },
  meditationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
    ...theme.shadows.small,
  },
  meditationIcon: {
    width: 60,
    height: 60,
    borderRadius: theme.borders.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
    ...theme.shadows.small,
  },
  meditationEmoji: {
    fontSize: 24,
  },
  meditationInfo: {
    flex: 1,
  },
  meditationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  lockIcon: {
    fontSize: theme.typography.sizes.md,
    marginRight: theme.spacing.sm,
  },
  meditationTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  meditationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soundIcon: {
    fontSize: theme.typography.sizes.sm,
    marginRight: theme.spacing.sm,
  },
  meditationMeta: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.secondary,
    fontFamily: theme.typography.fontFamily,
  },
  arrowIcon: {
    fontSize: 24,
    color: theme.colors.secondary,
    marginLeft: theme.spacing.md,
  },
}); 