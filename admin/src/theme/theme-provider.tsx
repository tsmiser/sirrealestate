import MuiLayerOverride from './mui-layer-override'
import { type ReactNode, useEffect, useState } from 'react'
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles'

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
    grey: {
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
    MuiInput: { defaultProps: { disableUnderline: true } },
    MuiButtonBase: {
      defaultProps: { disableRipple: true, disableTouchRipple: true },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: true },
    },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiCard: { defaultProps: { elevation: 2 } },
  },
})

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const classList = document.documentElement.classList
    classList.remove('light', 'dark')
    classList.add('theme-blue', mode)
  }, [mode])

  return (
    <>
      <MuiLayerOverride />
      <MuiThemeProvider theme={muiTheme} defaultMode={mode}>
        {children}
      </MuiThemeProvider>
    </>
  )
}
