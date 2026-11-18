import { useEffect, useLayoutEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { isThemePreference, themeConfig } from './config'
import type { ThemePreference } from './config'
import { ThemeContext } from './context'

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(themeConfig.storageKey)
    return isThemePreference(stored) ? stored : themeConfig.defaultPreference
  } catch {
    return themeConfig.defaultPreference
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setStoredPreference] = useState(readPreference)
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const resolvedTheme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystemDark(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
  }, [resolvedTheme])

  function setPreference(value: string) {
    if (!isThemePreference(value)) return
    setStoredPreference(value)
    try {
      localStorage.setItem(themeConfig.storageKey, value)
    } catch {
      // Blocked storage should not prevent switching themes.
    }
  }

  return <ThemeContext.Provider value={{ preference, resolvedTheme, setPreference }}>{children}</ThemeContext.Provider>
}
