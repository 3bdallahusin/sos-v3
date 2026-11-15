/**
 * SOS V3 Design Tokens
 * Directly sourced from DESIGN.md (Canonical Visual Specification)
 */

export const SOS_COLORS = {
  // Surfaces & Backgrounds
  base: '#000000',
  sidebar: '#09090B',
  surface1: '#0C0C0E',
  surface2: '#141417',
  surface3: '#1C1C21',
  hover: 'rgba(255, 255, 255, 0.05)',
  active: 'rgba(255, 255, 255, 0.09)',

  // Borders & Dividers
  borderSubtle: '#222226',
  borderDefault: '#2A2A30',
  borderStrong: '#3F3F46',
  borderInteractive: '#52525B',
  borderFocus: '#FAFAFA',

  // Foreground & Typography
  primary: '#FAFAFA',
  secondary: '#A1A1AA',
  muted: '#71717A',
  disabled: '#4B4B52',
  placeholder: '#63636B',

  // Semantic Accents
  pomodoro: '#F97316',
  success: '#16A34A',
  error: '#DC2626',
  warning: '#D97706',
  info: '#3B82F6'
} as const;

export const SOS_RADII = {
  micro: '10px',
  control: '14px',
  card: '18px',
  island: '24px',
  modal: '28px',
  toolbar: '14px',
  pill: '9999px'
} as const;
