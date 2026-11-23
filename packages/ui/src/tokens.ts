/**
 * SOS V3 Design Tokens
 * Directly sourced from DESIGN.md and Home Page (Canonical Single Source of Truth)
 */

export const SOS_COLORS = {
  // Surfaces & Backgrounds
  base: '#000000',
  sidebar: '#09090B',
  ground: '#080808',
  surface1: '#0C0C0E',
  surface2: '#141417',
  surface3: '#1C1C21',
  card: '#111113',
  cardHover: '#161619',
  hover: 'rgba(255, 255, 255, 0.05)',
  active: 'rgba(255, 255, 255, 0.09)',

  // Borders & Dividers
  borderSubtle: '#1E1E22',
  borderDefault: '#27272A',
  borderStrong: '#3F3F46',
  borderInteractive: '#323238',
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
  micro: '8px',
  control: '10px',
  card: '12px',
  island: '24px',
  modal: '16px',
  toolbar: '14px',
  pill: '9999px'
} as const;

export const SOS_LAYOUT = {
  pageOuter: 'flex-1 overflow-y-auto custom-scrollbar px-4 py-4 md:px-8 md:py-6 flex flex-col items-center bg-[#080808]',
  pageInner: 'w-[92%] max-w-[1360px] flex flex-col gap-4',
  cardSurface: 'rounded-[12px] bg-[#111113] border border-[#1E1E22] transition-all duration-150 ease-out hover:-translate-y-[1px] hover:border-[#323238] hover:shadow-[0_4px_12px_rgba(0,0,0,0.25)]'
} as const;

