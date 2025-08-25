// Design System for Sketched Form-like Aesthetic
export const theme = {
  // Colors
  colors: {
    primary: '#000000',
    secondary: '#666666',
    background: '#f8f6f1',
    surface: '#ffffff',
    success: '#90EE90',
    disabled: '#cccccc',
    disabledText: '#999999',
    text: {
      primary: '#000000',
      secondary: '#666666',
      onPrimary: '#ffffff',
    },
    border: '#000000',
    shadow: '#000000',
  },
  
  // Typography
  typography: {
    fontFamily: 'System',
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
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
      md: 8,
      lg: 12,
      xl: 16,
      xxl: 20,
    },
    width: {
      thin: 1,
      normal: 2,
      thick: 3,
    },
  },
  
  // Border Radius (for direct access)
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
  },
  
  // Shadows
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 1, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
  },
  
  // Common Styles
  common: {
    container: {
      flex: 1,
      backgroundColor: '#f8f6f1',
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 120, // Increased to account for larger tab bar
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 16,
      borderWidth: 2,
      borderColor: '#000000',
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    inputField: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 2,
      borderColor: '#000000',
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    button: {
      backgroundColor: '#000000',
      borderRadius: 8,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderWidth: 2,
      borderColor: '#000000',
      shadowColor: '#000',
      shadowOffset: { width: 1, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#ffffff',
      fontFamily: 'System',
    },
    title: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: '#000000',
      fontFamily: 'System',
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: '#666666',
      fontFamily: 'System',
    },
    bodyText: {
      fontSize: 14,
      fontWeight: '400' as const,
      color: '#000000',
      fontFamily: 'System',
    },
  },
};

export type Theme = typeof theme; 