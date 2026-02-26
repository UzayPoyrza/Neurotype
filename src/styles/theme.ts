// Neurotype Design System -- Dark Scientific Aesthetic
// Clinical research interface with deep navy-black palette
// NOT generic dark mode -- distinctive scientific depth

export const theme = {
  // Colors -- Scientific Dark Palette
  colors: {
    primary: '#F2F2F7',
    secondary: '#A0A0B0',
    background: '#0A0A0F',
    surface: '#12121A',
    surfaceElevated: '#1A1A24',
    surfacetertiary: '#222230',
    success: '#30D158',
    disabled: '#2A2A36',
    disabledText: '#6B6B7B',
    accent: '#0A84FF',
    accentSecondary: '#4ECDC4', // Scientific teal for data visualization
    accentWarm: '#FFB347', // Warm amber for data highlights
    text: {
      primary: '#F2F2F7',
      secondary: '#A0A0B0',
      tertiary: '#6B6B7B',
      onPrimary: '#0A0A0F',
    },
    border: 'rgba(255, 255, 255, 0.06)',
    borderMedium: 'rgba(255, 255, 255, 0.10)',
    borderLight: 'rgba(255, 255, 255, 0.03)',
    shadow: '#000000',
    // Glassmorphism tokens
    glass: {
      background: 'rgba(255, 255, 255, 0.05)',
      backgroundElevated: 'rgba(255, 255, 255, 0.08)',
      border: 'rgba(255, 255, 255, 0.10)',
      borderSubtle: 'rgba(255, 255, 255, 0.06)',
    },
    // Filter bar specific colors
    filter: {
      active: '#F2F2F7',
      inactive: '#12121A',
      border: 'rgba(255, 255, 255, 0.08)',
      badge: '#30D158',
      separator: 'rgba(255, 255, 255, 0.06)',
    },
    // Category specific colors for module badges
    category: {
      disorder: {
        background: '#FF453A',
        text: '#FFFFFF',
      },
      wellness: {
        background: '#30D158',
        text: '#FFFFFF',
      },
      skill: {
        background: '#0A84FF',
        text: '#FFFFFF',
      },
    },
  },

  // Typography
  typography: {
    fontFamily: 'System',
    sizes: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 17,
      xl: 20,
      xxl: 28,
      xxxl: 34,
    },
    weights: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },

  // Scientific Typography -- clinical/research-grade type styles
  scientific: {
    // Uppercase, tracked, small -- for data labels like "SESSIONS", "AVG REDUCTION"
    dataLabel: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: '#6B6B7B',
      textTransform: 'uppercase' as const,
      letterSpacing: 1.2,
      fontFamily: 'System',
    },
    // Tabular numbers, bold -- for measurement values like "4.2", "87%"
    measurementValue: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: '#F2F2F7',
      fontFamily: 'System',
      fontVariant: ['tabular-nums' as const],
    },
    // Medium weight, slightly tracked -- for section headers like "Technique Effectiveness"
    sectionHeader: {
      fontSize: 13,
      fontWeight: '500' as const,
      color: '#A0A0B0',
      letterSpacing: 0.5,
      fontFamily: 'System',
    },
    // Small mono-style for timestamps, IDs
    mono: {
      fontSize: 12,
      fontWeight: '400' as const,
      color: '#6B6B7B',
      letterSpacing: 0.3,
      fontFamily: 'System',
    },
    // Inline stat -- smaller bold number used in rows
    inlineStat: {
      fontSize: 17,
      fontWeight: '600' as const,
      color: '#F2F2F7',
      fontFamily: 'System',
      fontVariant: ['tabular-nums' as const],
    },
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  // Borders
  borders: {
    radius: {
      sm: 6,
      md: 10,
      lg: 14,
      xl: 18,
      xxl: 22,
    },
    width: {
      thin: 0.5,
      normal: 1,
      thick: 2,
    },
  },

  // Border Radius (for direct access)
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    xxl: 22,
  },

  // Shadows -- deeper on scientific dark
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.4,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 4,
    },
  },

  // Common Styles
  common: {
    container: {
      flex: 1,
      backgroundColor: '#0A0A0F',
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 120,
    },
    card: {
      backgroundColor: '#12121A',
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    inputField: {
      backgroundColor: '#12121A',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    button: {
      backgroundColor: '#0A84FF',
      borderRadius: 12,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderWidth: 0,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    buttonText: {
      fontSize: 17,
      fontWeight: '600' as const,
      color: '#ffffff',
      fontFamily: 'System',
    },
    title: {
      fontSize: 34,
      fontWeight: '700' as const,
      color: '#F2F2F7',
      fontFamily: 'System',
    },
    subtitle: {
      fontSize: 17,
      fontWeight: '400' as const,
      color: '#A0A0B0',
      fontFamily: 'System',
    },
    bodyText: {
      fontSize: 15,
      fontWeight: '400' as const,
      color: '#F2F2F7',
      fontFamily: 'System',
    },
  },

  // Apple Health Dark -- Scientific variant
  health: {
    container: {
      flex: 1,
      backgroundColor: '#0A0A0F',
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 120,
    },
    card: {
      backgroundColor: '#12121A',
      borderRadius: 14,
      marginHorizontal: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    cardPadding: {
      padding: 16,
    },
    cardHeader: {
      flexDirection: 'column' as const,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: 'rgba(255, 255, 255, 0.08)',
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: '#6B6B7B',
      textTransform: 'uppercase' as const,
      letterSpacing: 0.8,
    },
    cardSubtitle: {
      fontSize: 15,
      color: '#6B6B7B',
      fontWeight: '400' as const,
      marginBottom: 12,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
    },
    title: {
      fontSize: 34,
      fontWeight: 'bold' as const,
      color: '#F2F2F7',
      marginBottom: 4,
    },
    dateText: {
      fontSize: 17,
      color: '#A0A0B0',
      fontWeight: '400' as const,
    },
    subtitle: {
      fontSize: 17,
      color: '#A0A0B0',
      fontWeight: '400' as const,
    },
    button: {
      backgroundColor: '#0A84FF',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    buttonText: {
      fontSize: 17,
      fontWeight: '600' as const,
      color: '#ffffff',
    },
    secondaryButton: {
      backgroundColor: '#1A1A24',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    secondaryButtonText: {
      fontSize: 17,
      fontWeight: '600' as const,
      color: '#F2F2F7',
    },
    inputField: {
      backgroundColor: '#12121A',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    inputFieldFocused: {
      borderWidth: 1,
      borderColor: '#0A84FF',
    },
    bodyText: {
      fontSize: 17,
      fontWeight: '400' as const,
      color: '#F2F2F7',
      lineHeight: 22,
    },
    captionText: {
      fontSize: 13,
      fontWeight: '400' as const,
      color: '#6B6B7B',
    },
    bottomSpacing: {
      height: 120,
    },
  },
};

export type Theme = typeof theme;
