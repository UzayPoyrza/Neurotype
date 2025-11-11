import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useStore } from '../store/useStore';
import { theme } from '../styles/theme';
import { mentalHealthModules } from '../data/modules';
import { mockSessions } from '../data/mockData';

type SectionKey = 'history' | 'today' | 'tomorrow';

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

const formatRelativeDate = (date: string) => {
  const target = new Date(date);
  const today = new Date();

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(today) - startOfDay(target)) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatShortDate = (date: string) => {
  const parsed = new Date(date);
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const ProgressScreen: React.FC = () => {
  const { userProgress, globalBackgroundColor, setCurrentScreen, todayModuleId } = useStore(state => ({
    userProgress: state.userProgress,
    globalBackgroundColor: state.globalBackgroundColor,
    setCurrentScreen: state.setCurrentScreen,
    todayModuleId: state.todayModuleId,
  }));

  const [activeSection, setActiveSection] = useState<SectionKey>('history');

  React.useEffect(() => {
    setCurrentScreen('progress');
  }, [setCurrentScreen]);

  const focusedModule = useMemo(() => {
    const fallbackModule = mentalHealthModules[0];
    if (!todayModuleId) {
      return fallbackModule;
    }
    return mentalHealthModules.find(module => module.id === todayModuleId) || fallbackModule;
  }, [todayModuleId]);

  const moduleSessionDeltas = useMemo(() => {
    return userProgress.sessionDeltas
      .filter(delta => delta.moduleId === focusedModule.id)
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [focusedModule.id, userProgress.sessionDeltas]);

  const completedSessionDetails = useMemo(() => {
    return moduleSessionDeltas.map(delta => {
      const session = mockSessions.find(s => s.id === delta.sessionId);
      return {
        ...delta,
        title: session?.title ?? 'Meditation Session',
        durationMin: session?.durationMin ?? null,
        modality: session?.modality ?? null,
      };
    });
  }, [moduleSessionDeltas]);

  const completedSessionIds = useMemo(() => new Set(moduleSessionDeltas.map(delta => delta.sessionId)), [moduleSessionDeltas]);

  const moduleSessions = useMemo(() => {
    const goals = moduleGoalMap[focusedModule.id] || ['focus'];
    return mockSessions.filter(session => goals.includes(session.goal));
  }, [focusedModule.id]);

  const uncompletedSessions = useMemo(() => {
    return moduleSessions.filter(session => !completedSessionIds.has(session.id));
  }, [completedSessionIds, moduleSessions]);

  const todaySessions = useMemo(() => {
    return uncompletedSessions.slice(0, 3).map((session, index) => ({
      ...session,
      isRecommended: index === 0,
    }));
  }, [uncompletedSessions]);

  const todayDateString = React.useMemo(() => new Date().toISOString().split('T')[0], []);
  const hasCompletedToday = moduleSessionDeltas.some(delta => delta.date === todayDateString);

  const tomorrowSession = useMemo(() => {
    if (!hasCompletedToday) {
      return null;
    }
    const offset = todaySessions.length;
    return uncompletedSessions[offset] || null;
  }, [hasCompletedToday, todaySessions.length, uncompletedSessions]);

  const totalCompleted = moduleSessionDeltas.length;
  const completionPercent = focusedModule.meditationCount
    ? Math.min(100, Math.round((totalCompleted / focusedModule.meditationCount) * 100))
    : 0;
  const lastCompleted = completedSessionDetails[0];

  const sections: { key: SectionKey; label: string }[] = [
    { key: 'history', label: 'History' },
    { key: 'today', label: "Today's Plan" },
    { key: 'tomorrow', label: 'Tomorrow' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
      <View style={[styles.stickyHeader, { backgroundColor: globalBackgroundColor }]}>
        <Text style={styles.title}>Progress Path</Text>
        <View style={styles.moduleTag}>
          <View style={[styles.moduleDot, { backgroundColor: focusedModule.color }]} />
          <Text style={styles.moduleTagText}>{focusedModule.title}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>Your {focusedModule.title} Journey</Text>
            <Text style={styles.heroPercent}>{completionPercent}%</Text>
          </View>
          <Text style={styles.heroSubtitle}>
            {totalCompleted} of {focusedModule.meditationCount} meditations completed
          </Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${completionPercent}%`, backgroundColor: focusedModule.color }]} />
          </View>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Current streak</Text>
              <Text style={styles.heroStatValue}>{userProgress.streak} days</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Last session</Text>
              <Text style={styles.heroStatValue}>
                {lastCompleted ? formatRelativeDate(lastCompleted.date) : 'Not started'}
              </Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Best streak</Text>
              <Text style={styles.heroStatValue}>{userProgress.bestStreak} days</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionSwitcher}>
          {sections.map(section => (
            <TouchableOpacity
              key={section.key}
              style={[styles.sectionButton, activeSection === section.key && styles.sectionButtonActive]}
              onPress={() => setActiveSection(section.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.sectionButtonText, activeSection === section.key && styles.sectionButtonTextActive]}>
                {section.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionContent}>
          {activeSection === 'history' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Previous Meditations</Text>
              {completedSessionDetails.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.timelineScroll}
                >
                  {completedSessionDetails.map((item, index) => (
                    <View key={`${item.sessionId}-${item.date}-${index}`} style={styles.timelineItem}>
                      <View style={[styles.timelineBadge, { borderColor: focusedModule.color }]}>
                        <Text style={styles.timelineBadgeText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.timelineTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.timelineMeta}>{formatShortDate(item.date)}</Text>
                      {index !== completedSessionDetails.length - 1 && <View style={styles.timelineConnector} />}
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.emptyStateText}>
                  Your completed meditations for this module will appear here.
                </Text>
              )}
            </View>
          )}

          {activeSection === 'today' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Today&apos;s Meditations</Text>
              {todaySessions.length > 0 ? (
                todaySessions.map(session => (
                  <View key={session.id} style={styles.sessionRow}>
                    <View style={[styles.sessionIcon, { backgroundColor: focusedModule.color }]}>
                      <Text style={styles.sessionIconText}>{session.durationMin}</Text>
                    </View>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionTitle}>{session.title}</Text>
                      <Text style={styles.sessionMeta}>
                        {session.durationMin} min · {session.modality}
                      </Text>
                    </View>
                    {session.isRecommended && (
                      <View style={styles.recommendedPill}>
                        <Text style={styles.recommendedPillText}>Recommended</Text>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyStateText}>
                  You’re all caught up for today. Enjoy a mindful break!
                </Text>
              )}
            </View>
          )}

          {activeSection === 'tomorrow' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tomorrow&apos;s Preview</Text>
              {hasCompletedToday ? (
                tomorrowSession ? (
                  <View style={styles.tomorrowCard}>
                    <View style={styles.tomorrowHeader}>
                      <Text style={styles.tomorrowTitle}>{tomorrowSession.title}</Text>
                      <Text style={styles.tomorrowMeta}>
                        {tomorrowSession.durationMin} min · {tomorrowSession.modality}
                      </Text>
                    </View>
                    <Text style={styles.tomorrowHint}>
                      Great job today! This session will unlock first thing tomorrow morning.
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.emptyStateText}>
                    You’ve completed every meditation in this module. Explore another module to keep growing.
                  </Text>
                )
              ) : (
                <View style={styles.lockedCard}>
                  <Text style={styles.lockedTitle}>Finish today to unlock tomorrow</Text>
                  <Text style={styles.lockedSubtitle}>
                    Complete one of today&apos;s meditations to get a sneak peek at what&apos;s next.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  ...theme.health, // Use global Apple Health styles
  container: {
    flex: 1,
    position: 'relative',
  },
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
  scrollContent: {
    paddingTop: 120,
    paddingBottom: 40,
  },
  moduleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  moduleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  moduleTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1d1d1f',
  },
  heroCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  heroPercent: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#8e8e93',
    marginBottom: 16,
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f2f2f7',
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStat: {
    flex: 1,
  },
  heroStatLabel: {
    fontSize: 13,
    color: '#8e8e93',
    marginBottom: 4,
  },
  heroStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  sectionSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#ececef',
    borderRadius: 16,
    padding: 4,
  },
  sectionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  sectionButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6c6c70',
  },
  sectionButtonTextActive: {
    color: '#000000',
  },
  sectionContent: {
    marginHorizontal: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 14,
  },
  timelineScroll: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  timelineItem: {
    width: 160,
    marginRight: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f2f2f7',
    backgroundColor: '#f9f9fb',
    position: 'relative',
  },
  timelineBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  timelineBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  timelineMeta: {
    fontSize: 12,
    color: '#8e8e93',
  },
  timelineConnector: {
    position: 'absolute',
    right: -12,
    top: '50%',
    width: 24,
    height: 2,
    backgroundColor: '#d1d1d6',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8e8e93',
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionIconText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  sessionMeta: {
    fontSize: 13,
    color: '#8e8e93',
  },
  recommendedPill: {
    backgroundColor: '#007aff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  recommendedPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  tomorrowCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f2f2f7',
    backgroundColor: '#f9f9fb',
    padding: 16,
  },
  tomorrowHeader: {
    marginBottom: 8,
  },
  tomorrowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  tomorrowMeta: {
    fontSize: 13,
    color: '#8e8e93',
  },
  tomorrowHint: {
    fontSize: 13,
    color: '#6c6c70',
    marginTop: 6,
  },
  lockedCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    backgroundColor: '#ffffff',
    padding: 16,
  },
  lockedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
  },
  lockedSubtitle: {
    fontSize: 13,
    color: '#8e8e93',
  },
  bottomSpacing: {
    height: 120,
  },
}); 