'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

const emptySubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className="relative w-9 h-9 rounded-xl bg-white/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center pointer-events-auto z-50">
        <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600" />
      </div>
    );
  }

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <motion.button
      onClick={toggleTheme}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className="relative w-9 h-9 rounded-xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors duration-300 group overflow-hidden pointer-events-auto z-50 cursor-pointer"
      whileTap={{ scale: 0.9 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Mode Terang' : 'Mode Gelap'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ y: -20, opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
            exit={{ y: 20, opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Sun className="w-4 h-4 text-amber-500 group-hover:text-amber-400 transition-colors" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ y: -20, opacity: 0, rotate: 90, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
            exit={{ y: 20, opacity: 0, rotate: -90, scale: 0.5 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Moon className="w-4 h-4 text-sky-700 group-hover:text-sky-600 transition-colors" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
