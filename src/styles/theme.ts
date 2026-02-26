// Neurotype Design System — Dual-mode theme (Dark + Light)
// Dark: Scientific clinical research interface with deep navy-black palette
// Light: Apple Health–inspired with grouped background and white cards

// ─── Color Palettes ────────────────────────────────────────────────────────────

const darkColors = {
  primary: '#F2F2F7',
  secondary: '#A0A0B0',
  background: '#0A0A0F',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  surfaceTertiary: '#3A3A3C',
  success: '#30D158',
  disabled: '#38383A',
  disabledText: '#6B6B7B',
  accent: '#0A84FF',
  accentSecondary: '#4ECDC4',
  accentWarm: '#FFB347',
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
  glass: {
    background: 'rgba(255, 255, 255, 0.05)',
    backgroundElevated: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.10)',
    borderSubtle: 'rgba(255, 255, 255, 0.06)',
  },
  filter: {
    active: '#F2F2F7',
    inactive: '#1C1C1E',
    border: 'rgba(255, 255, 255, 0.08)',
    badge: '#30D158',
    separator: 'rgba(255, 255, 255, 0.06)',
  },
  category: {
    disorder: { background: '#FF453A', text: '#FFFFFF' },
    wellness: { background: '#30D158', text: '#FFFFFF' },
    skill: { background: '#0A84FF', text: '#FFFFFF' },
  },
};

const lightColors = {
  primary: '#000000',
  secondary: '#8e8e93',
  background: '#f2f1f6',
  surface: '#ffffff',
  surfaceElevated: '#f0f0f5',
  surfaceTertiary: '#e5e5ea',
  success: '#34C759',
  disabled: '#d1d1d6',
  disabledText: '#c7c7cc',
  accent: '#007AFF',
  accentSecondary: '#4ECDC4',
  accentWarm: '#FFB347',
  text: {
    primary: '#000000',
    secondary: '#8e8e93',
    tertiary: '#aeaeb2',
    onPrimary: '#ffffff',
  },
  border: 'rgba(0, 0, 0, 0.04)',
  borderMedium: 'rgba(0, 0, 0, 0.08)',
  borderLight: 'rgba(0, 0, 0, 0.02)',
  shadow: 'rgba(0, 0, 0, 0.08)',
  glass: {
    background: 'rgba(255, 255, 255, 0.70)',
    backgroundElevated: 'rgba(255, 255, 255, 0.80)',
    border: 'rgba(0, 0, 0, 0.06)',
    borderSubtle: 'rgba(0, 0, 0, 0.04)',
  },
  filter: {
    active: '#000000',
    inactive: '#ffffff',
    border: 'rgba(0, 0, 0, 0.06)',
    badge: '#34C759',
    separator: 'rgba(0, 0, 0, 0.04)',
  },
  category: {
    disorder: { background: '#FF453A', text: '#FFFFFF' },
    wellness: { background: '#30D158', text: '#FFFFFF' },
    skill: { background: '#0A84FF', text: '#FFFFFF' },
  },
};

export type Colors = typeof darkColors;

// ─── Shared (non-color) tokens ─────────────────────────────────────────────────

const typography = {
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
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const borders = {
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
};

const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 22,
};

// ─── Theme Factory ─────────────────────────────────────────────────────────────

const createTheme = (colors: Colors, isDark: boolean) => ({
  isDark,
  colors,
  typography,
  spacing,
  borders,
  borderRadius,

  // Scientific Typography
  scientific: {
    dataLabel: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: colors.text.tertiary,
      textTransform: 'uppercase' as const,
      letterSpacing: 1.2,
      fontFamily: 'System',
    },
    measurementValue: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: colors.text.primary,
      fontFamily: 'System',
      fontVariant: ['tabular-nums' as const],
    },
    sectionHeader: {
      fontSize: 13,
      fontWeight: '500' as const,
      color: colors.text.secondary,
      letterSpacing: 0.5,
      fontFamily: 'System',
    },
    mono: {
      fontSize: 12,
      fontWeight: '400' as const,
      color: colors.text.tertiary,
      letterSpacing: 0.3,
      fontFamily: 'System',
    },
    inlineStat: {
      fontSize: 17,
      fontWeight: '600' as const,
      color: colors.text.primary,
      fontFamily: 'System',
      fontVariant: ['tabular-nums' as const],
    },
  },

  // Shadows — light in light mode, deep in dark mode
  shadows: {
    small: {
      shadowColor: isDark ? '#000' : '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.4 : 0.04,
      shadowRadius: isDark ? 3 : 2,
      elevation: 2,
    },
    medium: {
      shadowColor: isDark ? '#000' : '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.5 : 0.08,
      shadowRadius: isDark ? 12 : 8,
      elevation: 4,
    },
  },

  // Common Styles
  common: {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 120,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    inputField: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    button: {
      backgroundColor: colors.accent,
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
      color: colors.text.primary,
      fontFamily: 'System',
    },
    subtitle: {
      fontSize: 17,
      fontWeight: '400' as const,
      color: colors.text.secondary,
      fontFamily: 'System',
    },
    bodyText: {
      fontSize: 15,
      fontWeight: '400' as const,
      color: colors.text.primary,
      fontFamily: 'System',
    },
  },

  // Apple Health–style
  health: {
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      backgroundColor: colors.surface,
      borderRadius: 14,
      marginHorizontal: 20,
      marginBottom: 12,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
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
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: isDark ? '#8E8E93' : '#8e8e93',
      textTransform: 'uppercase' as const,
      letterSpacing: 0.8,
    },
    cardSubtitle: {
      fontSize: 15,
      color: colors.text.tertiary,
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
      color: colors.text.primary,
      marginBottom: 4,
    },
    dateText: {
      fontSize: 17,
      color: colors.text.secondary,
      fontWeight: '400' as const,
    },
    subtitle: {
      fontSize: 17,
      color: colors.text.secondary,
      fontWeight: '400' as const,
    },
    button: {
      backgroundColor: colors.accent,
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
      backgroundColor: colors.surfaceElevated,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      fontSize: 17,
      fontWeight: '600' as const,
      color: colors.text.primary,
    },
    inputField: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    inputFieldFocused: {
      borderWidth: 1,
      borderColor: colors.accent,
    },
    bodyText: {
      fontSize: 17,
      fontWeight: '400' as const,
      color: colors.text.primary,
      lineHeight: 22,
    },
    captionText: {
      fontSize: 13,
      fontWeight: '400' as const,
      color: colors.text.tertiary,
    },
    bottomSpacing: {
      height: 120,
    },
  },
});

// ─── Exported Themes ───────────────────────────────────────────────────────────

export const darkTheme = createTheme(darkColors, true);
export const lightTheme = createTheme(lightColors, false);

// Backward-compat alias — unconverted files keep `import { theme }`
export const theme = darkTheme;

export type Theme = ReturnType<typeof createTheme>;
