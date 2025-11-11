import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useStore } from '../store/useStore';
import { theme } from '../styles/theme';
import { mentalHealthModules } from '../data/modules';
import { mockSessions } from '../data/mockData';
import { InfoBox } from '../components/InfoBox';
import { Session, SessionDelta } from '../types';

const moduleGoalMap: Record<string, string[]> = {
  anxiety: ['anxiety'],
  adhd: ['focus'],
  depression: ['sleep', 'focus'],
  bipolar: ['anxiety', 'sleep'],
  panic: ['anxiety'],
  ptsd: ['anxiety', 'sleep'],
  stress: ['anxiety', 'focus'],
  sleep: ['sleep'],
  focus: ['focus'],
  'emotional-regulation': ['anxiety', 'focus'],
  mindfulness: ['focus', 'sleep'],
  'self-compassion': ['sleep', 'focus'],
};

const getSessionsForModule = (moduleId: string): Session[] => {
  const goals = moduleGoalMap[moduleId] || ['focus'];
  return mockSessions.filter(session => goals.includes(session.goal));
};

const parseDeltaDate = (delta: SessionDelta): Date => {
  const date = new Date(delta.date);
  if (Number.isNaN(date.getTime())) {
    return new Date();
  }
  return date;
};

const formatTimelineDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const formatWeekday = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

const formatSessionMeta = (session: Session): string => {
  return `${session.durationMin} min • ${session.modality}`;
};

export const ProgressScreen: React.FC = () => {
  const userProgress = useStore(state => state.userProgress);
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  const setCurrentScreen = useStore(state => state.setCurrentScreen);
  const todayModuleId = useStore(state => state.todayModuleId);

  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    todayModuleId || mentalHealthModules[0]?.id || 'anxiety'
  );

  const [showStreakInfo, setShowStreakInfo] = useState(false);
  const [streakButtonActive, setStreakButtonActive] = useState(false);
  const streakButtonRef = useRef<any>(null);

  React.useEffect(() => {
    setCurrentScreen('progress');
  }, [setCurrentScreen]);

  React.useEffect(() => {
    if (todayModuleId && todayModuleId !== selectedModuleId) {
      setSelectedModuleId(todayModuleId);
    }
  }, [todayModuleId, selectedModuleId]);

  const selectedModule =
    mentalHealthModules.find(module => module.id === selectedModuleId) || mentalHealthModules[0];

  const moduleSessions = useMemo(() => getSessionsForModule(selectedModuleId), [selectedModuleId]);

  const completedSessions = useMemo(() => {
    return userProgress.sessionDeltas
      .filter(delta => delta.moduleId === selectedModuleId)
      .map(delta => {
        const session = mockSessions.find(item => item.id === delta.sessionId);
        return {
          delta,
          session,
          completedDate: parseDeltaDate(delta),
        };
      })
      .filter(item => item.session)
      .sort((a, b) => b.completedDate.getTime() - a.completedDate.getTime());
  }, [selectedModuleId, userProgress.sessionDeltas]);

  const completedCount = completedSessions.length;

  const remainingSessions = moduleSessions.slice(completedCount);
  const todaySessions = remainingSessions.slice(0, Math.min(2, remainingSessions.length));
  const tomorrowSession =
    remainingSessions.length > todaySessions.length
      ? remainingSessions[todaySessions.length]
      : undefined;

  const progressPercent = moduleSessions.length
    ? Math.min(1, completedCount / moduleSessions.length)
    : 0;

  const streak = userProgress.streak;
  const bestStreak = userProgress.bestStreak;

  const handleStreakPress = () => {
    setShowStreakInfo(true);
    setStreakButtonActive(true);
  };

  const handleCloseStreakInfo = () => {
    setShowStreakInfo(false);
    setStreakButtonActive(false);
  };

  const accentColor = selectedModule?.color || '#007AFF';
  const progressWidth = `${Math.max(progressPercent * 100, progressPercent > 0 ? 8 : 0)}%`;

  return (
    <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
      <View style={[styles.stickyHeader, { backgroundColor: globalBackgroundColor }]}>
        <Text style={styles.title}>Progress Path</Text>

        {streak > 0 && (
          <View style={styles.streakWrapper}>
            <TouchableOpacity
              ref={streakButtonRef}
              onPress={handleStreakPress}
              style={[styles.streakContainer, streakButtonActive && styles.streakContainerActive]}
            >
              <Text
                style={[
                  styles.headerStreakNumber,
                  streakButtonActive && styles.streakNumberActive,
                ]}
              >
                {streak}
              </Text>
              <Text style={styles.streakFire}>🔥</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.heroCard, { borderColor: accentColor + '33' }]}>
          <View style={styles.heroHeader}>
            <View style={[styles.heroIcon, { backgroundColor: accentColor + '22' }]}>
              <Text style={styles.heroIconGlyph}>🧭</Text>
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>{selectedModule?.title} Journey</Text>
              <Text style={styles.heroSubtitle}>
                {completedCount} of {moduleSessions.length} meditations completed
              </Text>
            </View>
          </View>

          <View style={styles.heroProgressRow}>
            <View style={styles.progressLabel}>
              <Text style={styles.progressLabelText}>Module Progress</Text>
              <Text style={styles.progressPercent}>
                {Math.round(progressPercent * 100)}
                %
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { backgroundColor: accentColor, width: progressWidth }]} />
            </View>
          </View>

          <View style={styles.heroFooter}>
            <Text style={styles.heroFooterLabel}>Up Next</Text>
            <Text style={styles.heroFooterValue}>
              {todaySessions.length > 0
                ? todaySessions[0].title
                : moduleSessions.length > 0
                  ? 'All meditations completed'
                  : 'No meditations yet'}
            </Text>
          </View>
        </View>

        <View style={styles.modulesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moduleChipRow}
          >
            {mentalHealthModules.map(module => {
              const isActive = module.id === selectedModuleId;
              return (
                <TouchableOpacity
                  key={module.id}
                  onPress={() => setSelectedModuleId(module.id)}
                  activeOpacity={0.8}
                  style={[
                    styles.moduleChip,
                    isActive && { backgroundColor: module.color },
                  ]}
                >
                  <Text
                    style={[
                      styles.moduleChipLabel,
                      isActive && styles.moduleChipLabelActive,
                    ]}
                  >
                    {module.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Up Next</Text>
            <Text style={styles.sectionSubtitle}>
              Complete today&apos;s practice to reveal tomorrow&apos;s
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.upNextRow}
          >
            <View style={[styles.upNextCard, { borderColor: accentColor + '33' }]}>
              <Text style={styles.upNextLabel}>Today</Text>
              {todaySessions.length > 0 ? (
                todaySessions.map(session => (
                  <TouchableOpacity key={session.id} style={styles.sessionRow} activeOpacity={0.8}>
                    <View style={styles.sessionRowText}>
                      <Text style={styles.sessionRowTitle}>{session.title}</Text>
                      <Text style={styles.sessionRowMeta}>{formatSessionMeta(session)}</Text>
                    </View>
                    <View style={[styles.sessionRowCTA, { backgroundColor: accentColor }]}>
                      <Text style={styles.sessionRowCTAIcon}>▶</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>You&apos;re on track!</Text>
                  <Text style={styles.emptyStateCopy}>
                    Check back tomorrow for your next meditation.
                  </Text>
                </View>
              )}
            </View>

            {moduleSessions.length > completedCount && (
              <View style={[styles.upNextCard, styles.tomorrowCard, { borderColor: accentColor + '22' }]}>
                <Text style={styles.upNextLabel}>Tomorrow</Text>
                {tomorrowSession ? (
                  <View style={styles.tomorrowContent}>
                    <Text style={styles.tomorrowTitle}>{tomorrowSession.title}</Text>
                    <Text style={styles.tomorrowMeta}>{formatSessionMeta(tomorrowSession)}</Text>
                    <View
                      style={[
                        styles.tomorrowBadge,
                        todaySessions.length === 0 && { backgroundColor: accentColor + '22' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tomorrowBadgeText,
                          todaySessions.length === 0 && { color: accentColor },
                        ]}
                      >
                        {todaySessions.length === 0 ? 'Ready to unlock' : 'Locked'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateTitle}>Finish today first</Text>
                    <Text style={styles.emptyStateCopy}>
                      Tomorrow&apos;s meditation unlocks once you complete today.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Previous Meditations</Text>
            <Text style={styles.sectionSubtitle}>
              {completedCount} completed in this module
            </Text>
          </View>

          {completedSessions.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timelineRow}
            >
              {completedSessions.map(item => (
                <View key={item.delta.date + item.delta.sessionId} style={styles.timelineCard}>
                  <View style={styles.timelineDate}>
                    <Text style={styles.timelineWeekday}>{formatWeekday(item.completedDate)}</Text>
                    <Text style={styles.timelineDay}>{formatTimelineDate(item.completedDate)}</Text>
                  </View>
                  <Text style={styles.timelineTitle} numberOfLines={2}>
                    {item.session?.title}
                  </Text>
                  <Text style={styles.timelineMeta}>{formatSessionMeta(item.session!)}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyStateLarge}>
              <Text style={styles.emptyStateTitle}>No meditations yet</Text>
              <Text style={styles.emptyStateCopy}>
                Start today&apos;s practice to build your journey.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <InfoBox
        isVisible={showStreakInfo}
        onClose={handleCloseStreakInfo}
        title="Streak Information"
        content={`Current Streak: ${streak} days\nBest Streak: ${bestStreak} days`}
        position={{ top: 101, right: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  ...theme.health,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  headerStreakNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
    marginRight: 4,
  },
  streakFire: {
    fontSize: 16,
  },
  streakContainerActive: {
    backgroundColor: '#FF8A65',
  },
  streakNumberActive: {
    color: '#FFFFFF',
  },
  streakWrapper: {
    position: 'relative',
  },
  scrollContent: {
    paddingTop: 120,
    paddingBottom: 40,
    paddingHorizontal: 20,
    gap: 28,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  heroIconGlyph: {
    fontSize: 28,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 4,
    fontFamily: 'System',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6C6C70',
    fontFamily: 'System',
  },
  heroProgressRow: {
    marginBottom: 20,
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabelText: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: 'System',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D1D1F',
    fontFamily: 'System',
  },
  progressTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroFooterLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'System',
  },
  heroFooterValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
    fontFamily: 'System',
  },
  modulesSection: {
    marginTop: -8,
  },
  moduleChipRow: {
    gap: 12,
    paddingVertical: 4,
  },
  moduleChip: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  moduleChipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    fontFamily: 'System',
  },
  moduleChipLabelActive: {
    color: '#FFFFFF',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
    fontFamily: 'System',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6C6C70',
    fontFamily: 'System',
  },
  upNextRow: {
    gap: 16,
  },
  upNextCard: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 180,
  },
  tomorrowCard: {
    backgroundColor: '#F8F9FD',
  },
  upNextLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
    fontFamily: 'System',
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  sessionRowText: {
    flex: 1,
    paddingRight: 12,
  },
  sessionRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
    fontFamily: 'System',
  },
  sessionRowMeta: {
    fontSize: 13,
    color: '#6C6C70',
    fontFamily: 'System',
  },
  sessionRowCTA: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionRowCTAIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 1,
    fontFamily: 'System',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyStateLarge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: 'System',
  },
  emptyStateCopy: {
    fontSize: 13,
    color: '#6C6C70',
    textAlign: 'center',
    fontFamily: 'System',
  },
  tomorrowContent: {
    gap: 12,
  },
  tomorrowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    fontFamily: 'System',
  },
  tomorrowMeta: {
    fontSize: 13,
    color: '#6C6C70',
    fontFamily: 'System',
  },
  tomorrowBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#E5E5EA',
  },
  tomorrowBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#636366',
    fontFamily: 'System',
  },
  timelineRow: {
    gap: 16,
  },
  timelineCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F2F2F7',
    gap: 12,
  },
  timelineDate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineWeekday: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    fontFamily: 'System',
  },
  timelineDay: {
    fontSize: 13,
    color: '#6C6C70',
    fontFamily: 'System',
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    fontFamily: 'System',
  },
  timelineMeta: {
    fontSize: 13,
    color: '#6C6C70',
    fontFamily: 'System',
  },
  bottomSpacing: {
    height: 60,
  },
});