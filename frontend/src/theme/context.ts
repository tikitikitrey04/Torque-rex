import { createContext } from 'react'
import type { ThemePreference } from './config'

export type ThemeContextValue = {
  preference: ThemePreference
  resolvedTheme: 'light' | 'dark'
  setPreference: (value: string) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

