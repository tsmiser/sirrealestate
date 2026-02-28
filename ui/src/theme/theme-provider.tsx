import MuiLayerOverride from './mui-layer-override'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles'

type ModeVariant = 'light' | 'dark' | 'system'

type ThemeContextType = {
  mode: ModeVariant
  setMode: (mode: ModeVariant) => void
  isDarkMode: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const muiTheme = createTheme({
  direction: 'ltr',
  spacing: 4,
  breakpoints: {
    values: {
      xs: 0,
      sm: 480,
      md: 960,
      lg: 1280,
      xl: 1440,
      '2xl': 1640,
      '3xl': 1900,
    },
  },
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  palette: {
    background: {
      default: 'hsl(var(--background))',
      paper: 'hsl(var(--background-paper))',
    },
    divider: 'hsl(var(--grey-100))',
    text: {
      primary: 'hsl(var(--text-primary))',
      secondary: 'hsl(var(--text-secondary))',
      disabled: 'hsl(var(--text-disabled))',
    },
    primary: {
      main: 'hsl(var(--primary))',
      light: 'hsl(var(--primary-light))',
      dark: 'hsl(var(--primary-dark))',
      contrastText: 'hsl(var(--text-contrast))',
    },
    secondary: {
      main: 'hsl(var(--secondary))',
      light: 'hsl(var(--secondary-light))',
      dark: 'hsl(var(--secondary-dark))',
      contrastText: 'hsl(var(--text-contrast))',
    },
    action: {
      disabled: 'hsla(var(--text-disabled) / .95)',
      disabledBackground: 'hsla(var(--text-disabled) / .5)',
      active: 'hsl(var(--text-primary))',
    },
    'accent-1': {
      main: 'hsl(var(--accent-1))',
      light: 'hsl(var(--accent-1-light))',
      dark: 'hsl(var(--accent-1-dark))',
      contrastText: 'hsl(var(--text-contrast))',
    },
    'accent-2': {
      main: 'hsl(var(--accent-2))',
      light: 'hsl(var(--accent-2-light))',
      dark: 'hsl(var(--accent-2-dark))',
      contrastText: 'hsl(var(--text-contrast))',
    },
    'accent-3': {
      main: 'hsl(var(--accent-3))',
      light: 'hsl(var(--accent-3-light))',
      dark: 'hsl(var(--accent-3-dark))',
      contrastText: 'hsl(var(--text-contrast))',
    },
    'accent-4': {
      main: 'hsl(var(--accent-4))',
      light: 'hsl(var(--accent-4-light))',
      dark: 'hsl(var(--accent-4-dark))',
      contrastText: 'hsl(var(--text-contrast))',
    },
    'accent-5': {
      main: 'hsl(var(--accent-5))',
      light: 'hsl(var(--accent-5-light))',
      dark: 'hsl(var(--accent-5-dark))',
      contrastText: 'hsl(var(--text-contrast))',
    },
    'accent-6': {
      main: 'hsl(var(--accent-6))',
      light: 'hsl(var(--accent-6-light))',
      dark: 'hsl(var(--accent-6-dark))',
      contrastText: 'hsl(var(--text-contrast))',
    },
    'text-primary': {
      main: 'hsl(var(--text-primary))',
      light: 'hsl(var(--text-primary-light))',
      dark: 'hsl(var(--text-primary-dark))',
      contrastText: 'hsl(var(--text-contrast-alternative))',
    },
    'text-secondary': {
      main: 'hsl(var(--text-secondary))',
      light: 'hsl(var(--text-secondary-light))',
      dark: 'hsl(var(--text-secondary-dark))',
      contrastText: 'hsl(var(--text-contrast-alternative))',
    },
    'text-disabled': {
      main: 'hsl(var(--text-disabled))',
      light: 'hsl(var(--text-disabled-light))',
      dark: 'hsl(var(--text-disabled-dark))',
      contrastText: 'hsl(var(--text-contrast-alternative))',
    },
    'text-muted': {
      main: 'hsl(var(--text-muted))',
      light: 'hsl(var(--text-muted-light))',
      dark: 'hsl(var(--text-muted-dark))',
      contrastText: 'hsl(var(--text-contrast-alternative))',
    },
    grey: {
      25: 'hsl(var(--grey-25))',
      50: 'hsl(var(--grey-50))',
      100: 'hsl(var(--grey-100))',
      200: 'hsl(var(--grey-200))',
      300: 'hsl(var(--grey-300))',
      400: 'hsl(var(--grey-400))',
      500: 'hsl(var(--grey-500))',
      600: 'hsl(var(--grey-600))',
      700: 'hsl(var(--grey-700))',
      800: 'hsl(var(--grey-800))',
      900: 'hsl(var(--grey-900))',
    },
    error: {
      main: 'hsl(var(--error))',
      light: 'hsl(var(--error-light))',
      dark: 'hsl(var(--error-dark))',
      contrastText: 'hsl(var(--text-contrast))',
    },
    info: {
      main: 'hsl(var(--info))',
      light: 'hsl(var(--info-light))',
      dark: 'hsl(var(--info-dark))',
      contrastText: 'hsl(var(--text-contrast))',
    },
    success: {
      main: 'hsl(var(--success))',
      light: 'hsl(var(--success-light))',
      dark: 'hsl(var(--success-dark))',
      contrastText: 'hsl(var(--text-contrast))',
    },
    warning: {
      main: 'hsl(var(--warning))',
      light: 'hsl(var(--warning-light))',
      dark: 'hsl(var(--warning-dark))',
      contrastText: 'hsl(var(--text-contrast))',
    },
  },
  components: {
    MuiCircularProgress: { defaultProps: { size: '1.5rem' } },
    MuiSwitch: {
      defaultProps: {
        disableRipple: true,
        disableFocusRipple: true,
        disableTouchRipple: true,
      },
    },
    MuiInput: { defaultProps: { disableUnderline: true } },
    MuiButtonBase: {
      defaultProps: { disableRipple: true, disableTouchRipple: true },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: true },
    },
    MuiButtonGroup: {
      defaultProps: { disableElevation: true, disableRipple: true },
    },
    MuiAccordion: { defaultProps: { elevation: 0 } },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiCard: { defaultProps: { elevation: 2 } },
  },
})

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ModeVariant>(
    () => (localStorage.getItem('themeMode') as ModeVariant) ?? 'light',
  )
  const [isDarkMode, setIsDarkMode] = useState(false)

  const setMode = (m: ModeVariant) => {
    localStorage.setItem('themeMode', m)
    setModeState(m)
  }

  useEffect(() => {
    const classList = document.documentElement.classList
    const preferredSystemMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
    const finalMode = mode === 'system' ? preferredSystemMode : mode

    classList.remove('light', 'dark')
    classList.add('theme-blue', finalMode)
    setIsDarkMode(finalMode === 'dark')

    setTimeout(
      () =>
        document.documentElement.style.setProperty('--layout-duration', '200ms'),
      200,
    )
  }, [mode])

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDarkMode }}>
      <MuiLayerOverride />
      <MuiThemeProvider theme={muiTheme} defaultMode={mode}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}

export const useThemeContext = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useThemeContext must be used within a ThemeProvider')
  return context
}
