import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('ssp_theme') || 'dark'
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    localStorage.setItem('ssp_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeContext;
