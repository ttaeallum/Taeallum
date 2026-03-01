import { useEffect, useState } from 'react';

type Theme = 'dark';

export function useTheme() {
  const [theme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Always force dark mode
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    setMounted(true);
  }, []);

  // toggleTheme is a no-op — dark mode only
  const toggleTheme = () => { };

  return { theme, toggleTheme, mounted };
}
