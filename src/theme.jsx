import { createContext, useContext, useEffect, useState } from 'react';
import { FluentProvider, makeStaticStyles, webDarkTheme, webLightTheme } from '@fluentui/react-components';

const STORAGE_KEY = 'telehealth-ews:theme';

const useGlobalStyles = makeStaticStyles({
  '*, *::before, *::after': { boxSizing: 'border-box' },
  'html, body, #root': { height: '100%', margin: 0 },
  body: { overscrollBehavior: 'none' },
  '::selection': { backgroundColor: 'rgba(15, 108, 189, 0.28)' },
  '*': { scrollbarWidth: 'thin', scrollbarColor: 'rgba(128, 128, 128, 0.45) transparent' },
});

const ThemeModeContext = createContext(null);

function initialMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // abaikan
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  useGlobalStyles();
  const [mode, setMode] = useState(initialMode);
  const theme = mode === 'dark' ? webDarkTheme : webLightTheme;

  useEffect(() => {
    document.body.style.backgroundColor = theme.colorNeutralBackground3;
    document.documentElement.style.colorScheme = mode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.colorBrandBackground);
  }, [mode, theme]);

  const toggle = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // abaikan
    }
  };

  return (
    <ThemeModeContext.Provider value={{ mode, theme, toggle }}>
      <FluentProvider theme={theme} style={{ height: '100%', backgroundColor: theme.colorNeutralBackground3 }}>
        {children}
      </FluentProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeModeContext);
}
