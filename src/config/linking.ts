import * as Linking from 'expo-linking';
import { LinkingOptions } from '@react-navigation/native';

const prefix = Linking.createURL('/');

export const linking: LinkingOptions<any> = {
  prefixes: [
    prefix,                      // neurotype://
    'https://www.neurotypeapp.com',     // Universal links
  ],
  config: {
    screens: {
      Today: {
        screens: {
          TodayMain: 'today',
          Roadmap: 'roadmap',
          MeditationDetail: 'sessions/:sessionId',
        },
      },
      Explore: {
        screens: {
          ExploreMain: 'explore',
          ModuleDetail: 'modules/:moduleId',
          MeditationDetail: 'explore/sessions/:sessionId',
        },
      },
      Progress: 'progress',
      Profile: {
        screens: {
          ProfileMain: 'profile',
          Settings: 'settings',
          Subscription: 'subscription',
          Payment: 'payment',
        },
      },
    },
  },
  // Custom URL parsing for /sessions/:sessionId URLs
  getStateFromPath: (path) => {
    // Handle /sessions/:sessionId URLs - route to Today > MeditationDetail
    const sessionMatch = path.match(/^\/?sessions\/([a-zA-Z0-9-]+)$/);
    if (sessionMatch) {
      const sessionId = sessionMatch[1];
      return {
        routes: [
          {
            name: 'Today',
            state: {
              routes: [
                { name: 'TodayMain' },
                { name: 'MeditationDetail', params: { sessionId } },
              ],
            },
          },
        ],
      };
    }
    // Fall back to default parsing for other paths
    return undefined;
  },
};

// Helper to create shareable URLs (uses https for better UX)
export const createSessionShareUrl = (sessionId: string): string => {
  return `https://www.neurotypeapp.com/sessions/${sessionId}`;
};

// Helper to create deep link URLs (for testing with custom scheme)
export const createSessionDeepLink = (sessionId: string): string => {
  return Linking.createURL(`sessions/${sessionId}`);
};
