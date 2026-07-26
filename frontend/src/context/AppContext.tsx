import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface AppContextValue {
  theme: Theme;
  toggleTheme: () => void;
  investigationsCount: number;
  setInvestigationsCount: (n: number) => void;
  activeCount: number;
  setActiveCount: (n: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('osinteye_theme') as Theme) || 'dark';
  });
  const [investigationsCount, setInvestigationsCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('osinteye_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <AppContext.Provider value={{ theme, toggleTheme, investigationsCount, setInvestigationsCount, activeCount, setActiveCount }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
