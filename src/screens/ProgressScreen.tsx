import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useStore } from '../store/useStore';
import { Sparkline } from '../components/Sparkline';
import { theme } from '../styles/theme';
import { TopNav } from '../components/TopNav';

export const ProgressScreen: React.FC = () => {
  const userProgress = useStore(state => state.userProgress);

  // Calculate stats
  const totalSessions = userProgress.sessionDeltas.length;
  const recentDeltas = userProgress.sessionDeltas.slice(-7);
  const avgDelta = recentDeltas.length > 0 
    ? recentDeltas.reduce((sum, delta) => sum + (delta.before - delta.after), 0) / recentDeltas.length
    : 0;

  // Calculate weekly progress
  const weeklySessions = userProgress.sessionDeltas.slice(-7);
  const weeklyAvgDelta = weeklySessions.length > 0 
    ? weeklySessions.reduce((sum, delta) => sum + (delta.before - delta.after), 0) / weeklySessions.length
    : 0;

  // Calculate monthly progress
  const monthlySessions = userProgress.sessionDeltas.slice(-30);
  const monthlyAvgDelta = monthlySessions.length > 0 
    ? monthlySessions.reduce((sum, delta) => sum + (delta.before - delta.after), 0) / monthlySessions.length
    : 0;

  return (
    <View style={styles.container}>
      <TopNav title="Progress" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Form-like Header */}
          <View style={styles.formHeader}>
            <View style={styles.titleField}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoText}>i</Text>
              </View>
              <Text style={styles.titlePlaceholder}>Progress Report</Text>
              <View style={styles.checkButton}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            </View>
            
            <View style={styles.descriptionField}>
              <Text style={styles.descriptionPlaceholder}>Your meditation journey analytics</Text>
            </View>
          </View>

          {/* Overall Stats */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Overall Progress
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {totalSessions}
                </Text>
                <Text style={styles.statLabel}>Total Sessions</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {userProgress.streak}
                </Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {avgDelta > 0 ? avgDelta.toFixed(1) : '0'}
                </Text>
                <Text style={styles.statLabel}>Avg Reduction</Text>
              </View>
            </View>
          </View>

          {/* Weekly Progress */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              This Week
            </Text>
            
            <View style={styles.weeklyStats}>
              <View style={styles.weeklyItem}>
                <Text style={styles.weeklyLabel}>Sessions</Text>
                <Text style={styles.weeklyValue}>{weeklySessions.length}</Text>
              </View>
              
              <View style={styles.weeklyItem}>
                <Text style={styles.weeklyLabel}>Avg Reduction</Text>
                <Text style={styles.weeklyValue}>
                  {weeklyAvgDelta > 0 ? weeklyAvgDelta.toFixed(1) : '0'} pts
                </Text>
              </View>
              
              <View style={styles.weeklyItem}>
                <Text style={styles.weeklyLabel}>Best Session</Text>
                <Text style={styles.weeklyValue}>
                  {weeklySessions.length > 0 
                    ? Math.max(...weeklySessions.map(d => d.before - d.after))
                    : '0'} pts
                </Text>
              </View>
            </View>
          </View>

          {/* Monthly Progress */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              This Month
            </Text>
            
            <View style={styles.monthlyStats}>
              <View style={styles.monthlyItem}>
                <Text style={styles.monthlyLabel}>Sessions</Text>
                <Text style={styles.monthlyValue}>{monthlySessions.length}</Text>
              </View>
              
              <View style={styles.monthlyItem}>
                <Text style={styles.monthlyLabel}>Avg Reduction</Text>
                <Text style={styles.monthlyValue}>
                  {monthlyAvgDelta > 0 ? monthlyAvgDelta.toFixed(1) : '0'} pts
                </Text>
              </View>
              
              <View style={styles.monthlyItem}>
                <Text style={styles.monthlyLabel}>Consistency</Text>
                <Text style={styles.monthlyValue}>
                  {monthlySessions.length > 0 
                    ? Math.round((monthlySessions.length / 30) * 100)
                    : '0'}%
                </Text>
              </View>
            </View>
          </View>

          {/* Trend Chart */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Anxiety Reduction Trend
            </Text>
            
            {userProgress.sessionDeltas.length > 0 ? (
              <View>
                <Sparkline data={userProgress.sessionDeltas} width={300} height={80} />
                <View style={styles.trendInfo}>
                  <Text style={styles.trendLabel}>
                    Last 7 sessions
                  </Text>
                  <Text style={styles.trendValue}>
                    {avgDelta > 0 ? '↓' : '→'} {Math.abs(avgDelta).toFixed(1)} pts avg
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.emptyText}>
                Complete your first session to see your progress trend
              </Text>
            )}
          </View>

          {/* Session History */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Recent Sessions
            </Text>
            
            {userProgress.sessionDeltas.length > 0 ? (
              <View style={styles.sessionHistory}>
                {userProgress.sessionDeltas.slice(-5).reverse().map((session, index) => (
                  <View key={index} style={styles.sessionItem}>
                    <View style={styles.sessionDate}>
                      <Text style={styles.sessionDateText}>
                        {new Date(session.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Text>
                    </View>
                    <View style={styles.sessionScores}>
                      <Text style={styles.sessionScore}>
                        {session.before} → {session.after}
                      </Text>
                      <Text style={styles.sessionReduction}>
                        -{session.before - session.after} pts
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                No sessions completed yet
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...theme.common.container,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    ...theme.common.content,
  },
  formHeader: {
    marginBottom: 40,
  },
  titleField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  infoIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  infoText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontStyle: 'italic',
  },
  titlePlaceholder: {
    flex: 1,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.secondary,
    fontFamily: theme.typography.fontFamily,
  },
  checkButton: {
    width: 24,
    height: 24,
    borderRadius: theme.borders.radius.sm,
    backgroundColor: theme.colors.success,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  descriptionField: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
    marginTop: theme.spacing.sm,
    marginLeft: theme.spacing.xl,
  },
  descriptionPlaceholder: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.secondary,
    fontFamily: theme.typography.fontFamily,
  },
  card: {
    ...theme.common.card,
    marginBottom: theme.spacing.xxl,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xl,
    fontFamily: theme.typography.fontFamily,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily,
  },
  statLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.secondary,
    textAlign: 'center',
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.fontFamily,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyItem: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.xs,
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.fontFamily,
  },
  weeklyValue: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  monthlyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthlyItem: {
    alignItems: 'center',
    flex: 1,
  },
  monthlyLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.xs,
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.fontFamily,
  },
  monthlyValue: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  trendInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  trendLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.secondary,
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.fontFamily,
  },
  trendValue: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  sessionHistory: {
    gap: theme.spacing.lg,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: theme.borders.width.normal,
    borderBottomColor: theme.colors.disabled,
  },
  sessionDate: {
    flex: 1,
  },
  sessionDateText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  sessionScores: {
    alignItems: 'flex-end',
  },
  sessionScore: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.weights.semibold,
  },
  sessionReduction: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  emptyText: {
    color: theme.colors.secondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.xxl,
    fontStyle: 'italic',
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.weights.semibold,
  },
}); 