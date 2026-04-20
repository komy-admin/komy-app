/**
 * Global color tokens.
 * CommonJS so tailwind.config.js (Node context) can require it,
 * and colors.ts can import it for the JS API.
 *
 * Conventions:
 *  - `brand`   — identity colors (change these to rebrand the app).
 *  - `neutral` — slate-based greyscale for text, borders, surfaces.
 *  - `gray`    — pure greyscale (kept separate from neutral for intent).
 *  - `semantic`— status colors (success/error/warning/info) with base/bg/border/text variants.
 *  - `surface` — named backgrounds (card, screen, muted).
 *
 * Change here = change everywhere (JS + Tailwind).
 */

const colors = {
  // === Brand ===
  brand: {
    dark: '#2A2E33',       // signature black (primary buttons, titles)
    accent: '#6366F1',     // indigo (links, focus, active states)
    accentDark: '#4F46E5',
  },

  // === Neutral (slate scale) ===
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // === Gray (pure scale) ===
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // === Semantic ===
  success: {
    base: '#10B981',       // emerald-500
    bg: '#ECFDF5',         // emerald-50
    border: '#34D399',     // emerald-400
    text: '#047857',       // emerald-700
    dark: '#059669',       // emerald-600
  },
  error: {
    base: '#EF4444',       // red-500
    bg: '#FEF2F2',         // red-50
    border: '#FECACA',     // red-200
    text: '#DC2626',       // red-600
    dark: '#B91C1C',       // red-700
  },
  warning: {
    base: '#F59E0B',       // amber-500
    bg: '#FFFBEB',         // amber-50
    border: '#FEF3C7',     // amber-100
    text: '#92400E',       // amber-800
    dark: '#D97706',       // amber-600
  },
  info: {
    base: '#3B82F6',       // blue-500
    bg: '#EFF6FF',         // blue-50
    border: '#BFDBFE',     // blue-200
    text: '#1D4ED8',       // blue-700
  },

  // === Extra accents (low usage, kept for specific features) ===
  purple: {
    base: '#A855F7',
    alt: '#8B5CF6',
  },
  pink: '#EC4899',

  // === Surfaces (named backgrounds) ===
  surface: {
    white: '#FFFFFF',
    screen: '#F8FAFC',     // alias of neutral.50
    card: '#FFFFFF',
    muted: '#F9FAFB',      // alias of gray.50
  },

  // === Overlays (modal backdrops, ripples) ===
  overlay: {
    modalSoft: 'rgba(0, 0, 0, 0.2)',        // subtle (ActionMenu animation)
    modal: 'rgba(0, 0, 0, 0.4)',            // standard backdrop (modals, side panels)
    modalStrong: 'rgba(0, 0, 0, 0.5)',      // appuyé (dropdown, overlay critique)
    modalHeavy: 'rgba(0, 0, 0, 0.7)',       // très opaque (color-picker)
    modalDarkSlate: 'rgba(15, 23, 42, 0.4)',// variante slate-900
    rippleDark: 'rgba(0, 0, 0, 0.1)',       // android ripple
  },

  // === Glass (semi-transparent whites) ===
  glass: {
    light: 'rgba(255, 255, 255, 0.5)',
    medium: 'rgba(255, 255, 255, 0.65)',
    heavy: 'rgba(255, 255, 255, 0.75)',
    opaque: 'rgba(255, 255, 255, 0.88)',
    solid: 'rgba(255, 255, 255, 0.99)',
  },

  // === Absolutes ===
  black: '#000000',
  white: '#FFFFFF',
};

module.exports = {
  colors,
};
