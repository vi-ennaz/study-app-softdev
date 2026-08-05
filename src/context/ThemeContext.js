import React, { createContext, useContext, useState } from 'react';
import { darkColors, lightColors } from '../theme';
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const colors = isDark ? darkColors : lightColors;
  const toggle = () => setIsDark(v => !v);
  return (
    <ThemeContext.Provider value = {{ isDark, colors, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}