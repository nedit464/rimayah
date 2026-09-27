'use client'

import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  window.dispatchEvent(new Event('themechange'))
}

function getThemeSnapshot(): Theme {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function subscribeTheme(callback: () => void) {
  window.addEventListener('themechange', callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener('themechange', callback)
    window.removeEventListener('storage', callback)
  }
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => 'light')

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'
    window.localStorage.setItem('theme', nextTheme)
    applyTheme(nextTheme)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center border border-border-default bg-surface-1 text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
      aria-label={theme === 'dark' ? 'Gunakan tema terang' : 'Gunakan tema gelap'}
      title={theme === 'dark' ? 'Tema terang' : 'Tema gelap'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
