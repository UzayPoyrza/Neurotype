// Neurotype Design System — Dark Scientific Aesthetic
// Inspired by Apple Health with clinical/research typography
export const theme = {
  // Colors — Dark Mode
  colors: {
    primary: '#FFFFFF',
    secondary: '#98989D',
    background: '#000000',
    surface: '#1C1C1E',
    surfaceElevated: '#2C2C2E',
    success: '#30D158',
    disabled: '#48484A',
    disabledText: '#636366',
    accent: '#0A84FF',
    text: {
      primary: '#FFFFFF',
      secondary: '#98989D',
      tertiary: '#636366',
      onPrimary: '#000000',
    },
    border: '#38383A',
    shadow: '#000000',
    // Filter bar specific colors
    filter: {
      active: '#FFFFFF',
      inactive: '#1C1C1E',
      border: '#38383A',
      badge: '#30D158',
      separator: '#38383A',
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

  // Shadows — subtle on dark
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
  },

  // Common Styles
  common: {
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 120,
    },
    card: {
      backgroundColor: '#1C1C1E',
      borderRadius: 14,
      padding: 16,
      borderWidth: 0,
      borderColor: 'transparent',
    },
    inputField: {
      backgroundColor: '#1C1C1E',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 0,
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
      color: '#FFFFFF',
      fontFamily: 'System',
    },
    subtitle: {
      fontSize: 17,
      fontWeight: '400' as const,
      color: '#98989D',
      fontFamily: 'System',
    },
    bodyText: {
      fontSize: 15,
      fontWeight: '400' as const,
      color: '#FFFFFF',
      fontFamily: 'System',
    },
  },

  // Apple Health Dark — Scientific variant
  health: {
    container: {
      flex: 1,
      backgroundColor: '#000000',
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
      backgroundColor: '#1C1C1E',
      borderRadius: 14,
      marginHorizontal: 20,
      marginBottom: 12,
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
      borderBottomColor: '#38383A',
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: '#98989D',
      textTransform: 'uppercase' as const,
      letterSpacing: 0.8,
    },
    cardSubtitle: {
      fontSize: 15,
      color: '#636366',
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
      color: '#FFFFFF',
      marginBottom: 4,
    },
    dateText: {
      fontSize: 17,
      color: '#98989D',
      fontWeight: '400' as const,
    },
    subtitle: {
      fontSize: 17,
      color: '#98989D',
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
      backgroundColor: '#2C2C2E',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    secondaryButtonText: {
      fontSize: 17,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    inputField: {
      backgroundColor: '#1C1C1E',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 0,
    },
    inputFieldFocused: {
      borderWidth: 1,
      borderColor: '#0A84FF',
    },
    bodyText: {
      fontSize: 17,
      fontWeight: '400' as const,
      color: '#FFFFFF',
      lineHeight: 22,
    },
    captionText: {
      fontSize: 13,
      fontWeight: '400' as const,
      color: '#636366',
    },
    bottomSpacing: {
      height: 120,
    },
  },
};

export type Theme = typeof theme;
