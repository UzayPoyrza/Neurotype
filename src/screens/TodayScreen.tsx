import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Session } from '../types';
import { useStore } from '../store/useStore';
import { mockSessions } from '../data/mockData';
import { theme } from '../styles/theme';
import { TopNav } from '../components/TopNav';

export const TodayScreen: React.FC = () => {
  const { setActiveSession } = useStore();
  const userProgress = useStore(state => state.userProgress);
  
  // Get today's recommended sessions (2 big nodes)
  const todaysSessions = [mockSessions[0], mockSessions[1]]; // Ocean Waves & Body Scan
  
  // Get completed sessions (small nodes above)
  const completedSessions = userProgress.sessionDeltas.length > 0 
    ? [mockSessions[2], mockSessions[3]] // Previous sessions
    : [];
  
  // Get future sessions (small nodes below)
  const futureSessions = [mockSessions[4], mockSessions[5]]; // Future sessions

  const onStartSession = (session: Session) => {
    setActiveSession(session);
  };

  const renderNode = (session: Session, size: 'large' | 'small', status: 'completed' | 'today' | 'future') => {
    const isLarge = size === 'large';
    const nodeStyle = [
      styles.node,
      isLarge ? styles.largeNode : styles.smallNode,
      status === 'completed' && styles.completedNode,
      status === 'today' && styles.todayNode,
      status === 'future' && styles.futureNode,
    ];

    const textStyle = [
      styles.nodeText,
      isLarge ? styles.largeNodeText : styles.smallNodeText,
    ];

    return (
      <TouchableOpacity
        key={session.id}
        style={nodeStyle}
        onPress={() => status === 'today' && onStartSession(session)}
        disabled={status !== 'today'}
      >
        {/* Hand-drawn play button for today's sessions */}
        {status === 'today' && isLarge && (
          <View style={styles.playButton}>
            <View style={styles.playTriangle} />
          </View>
        )}
        
        {/* Checkmark for completed sessions */}
        {status === 'completed' && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
        
        <Text style={textStyle} numberOfLines={isLarge ? 2 : 1}>
          {session.title}
        </Text>
        {isLarge && (
          <Text style={styles.nodeDuration}>
            {session.durationMin} min
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TopNav title="Today" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
        {/* Form-like Header */}
        <View style={styles.formHeader}>
          <View style={styles.titleField}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoText}>i</Text>
            </View>
            <Text style={styles.titlePlaceholder}>Custom Roadmap</Text>
            <View style={styles.checkButton}>
              <Text style={styles.checkText}>✓</Text>
            </View>
          </View>
          
          <View style={styles.descriptionField}>
            <Text style={styles.descriptionPlaceholder}>Your personalized meditation journey</Text>
          </View>
        </View>

        {/* Connected Roadmap */}
        <View style={styles.roadmapContainer}>
          {/* Completed Sessions Row */}
          {completedSessions.length > 0 && (
            <View style={styles.nodeRow}>
              {completedSessions.map((session, index) => (
                <View key={session.id} style={styles.nodeWrapper}>
                  {index > 0 && <View style={styles.connectionLine} />}
                  {renderNode(session, 'small', 'completed')}
                </View>
              ))}
            </View>
          )}

          {/* Connection Line to Today */}
          {completedSessions.length > 0 && (
            <View style={styles.verticalConnection} />
          )}

          {/* Today's Sessions Row */}
          <View style={styles.nodeRow}>
            {todaysSessions.map((session, index) => (
              <View key={session.id} style={styles.nodeWrapper}>
                {index > 0 && <View style={styles.connectionLine} />}
                {renderNode(session, 'large', 'today')}
              </View>
            ))}
          </View>

          {/* Connection Line to Future */}
          <View style={styles.verticalConnection} />

          {/* Future Sessions Row */}
          <View style={styles.nodeRow}>
            {futureSessions.map((session, index) => (
              <View key={session.id} style={styles.nodeWrapper}>
                {index > 0 && <View style={styles.connectionLine} />}
                {renderNode(session, 'small', 'future')}
              </View>
            ))}
          </View>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {userProgress.streak} day streak • {userProgress.sessionDeltas.length} sessions completed
          </Text>
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
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 3,
    borderColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  infoIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    fontStyle: 'italic',
  },
  titlePlaceholder: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'System',
  },
  checkButton: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#90EE90',
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  descriptionField: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 3,
    borderColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginTop: 8,
    marginLeft: 20,
  },
  descriptionPlaceholder: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'System',
  },
  roadmapContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  nodeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionLine: {
    width: 40,
    height: 3,
    backgroundColor: '#000000',
    marginHorizontal: 10,
    borderRadius: 2,
  },
  verticalConnection: {
    width: 3,
    height: 30,
    backgroundColor: '#000000',
    marginVertical: 10,
    borderRadius: 2,
  },
  node: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  largeNode: {
    width: 140,
    height: 140,
    padding: 16,
  },
  smallNode: {
    width: 80,
    height: 80,
    padding: 10,
  },
  todayNode: {
    backgroundColor: '#f8f9fa',
    borderColor: '#000000',
  },
  completedNode: {
    backgroundColor: '#e8f5e8',
    borderColor: '#000000',
  },
  futureNode: {
    backgroundColor: '#f8f9fa',
    borderColor: '#666666',
  },
  nodeText: {
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'System',
  },
  largeNodeText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 18,
  },
  smallNodeText: {
    fontSize: 12,
    color: '#000000',
  },
  nodeDuration: {
    fontSize: 12,
    color: '#666666',
    marginTop: 6,
    fontWeight: '500',
    fontFamily: 'System',
  },
  playButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  playTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 0,
    borderBottomWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: '#ffffff',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    marginLeft: 2,
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  progressText: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'System',
  },
}); 