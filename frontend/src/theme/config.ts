export type ThemePreference = 'system' | 'light' | 'dark'

export const themeConfig = {
  defaultPreference: 'system' as ThemePreference,
  storageKey: 'torque-rex:theme',
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}
