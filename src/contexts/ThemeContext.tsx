import React, { createContext, useContext, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { darkTheme, lightTheme, Theme } from '../styles/theme';

const ThemeContext = createContext<Theme>(darkTheme);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const darkThemeEnabled = useStore(state => state.darkThemeEnabled);

  const activeTheme = useMemo(
    () => (darkThemeEnabled ? darkTheme : lightTheme),
    [darkThemeEnabled],
  );

  return (
    <ThemeContext.Provider value={activeTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

/** Returns the currently active theme object (dark or light). */
export const useTheme = (): Theme => useContext(ThemeContext);

/** Convenience boolean — true when dark mode is active. */
export const useIsDark = (): boolean => useContext(ThemeContext).isDark;
