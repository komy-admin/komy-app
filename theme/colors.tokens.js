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
 *
 * Usage counts annotated as `// N×` (JS direct + Tailwind class usage, audit 2026-04-20).
 * `0×` = candidat suppression. Mettre à jour après refactor.
 */

const colors = {
  // === Brand ===
  brand: {
    dark: '#2A2E33',       // 154× — signature black (primary buttons, titles)
    accent: '#6366F1',     // 25×  — indigo (links, focus, active states)
    accentDark: '#4F46E5', // 5×
  },

  // === Neutral (slate scale) ===
  neutral: {
    50: '#F8FAFC',         // 35×
    100: '#F1F5F9',        // 19×
    200: '#E2E8F0',        // 75×
    300: '#CBD5E1',        // 11×
    400: '#94A3B8',        // 26×
    500: '#64748B',        // 61×
    600: '#475569',        // 11×
    800: '#1E293B',        // 44×
  },

  // === Gray (pure scale) ===
  gray: {
    50: '#F9FAFB',         // 49×
    100: '#F3F4F6',        // 64×
    200: '#E5E7EB',        // 99×
    300: '#D1D5DB',        // 60×
    400: '#9CA3AF',        // 115×
    500: '#6B7280',        // 164×
    600: '#4B5563',        // 38×
    700: '#374151',        // 48×
    800: '#1F2937',        // 34×
    900: '#111827',        // 26×
  },

  // === Semantic ===
  success: {
    base: '#10B981',       // 52× — emerald-500
    bg: '#ECFDF5',         // 9×  — emerald-50
    border: '#34D399',     // 6×  — emerald-400
    text: '#047857',       // 7×  — emerald-700
    dark: '#059669',       // 14× — emerald-600
  },
  error: {
    base: '#EF4444',       // 70× — red-500
    bg: '#FEF2F2',         // 25× — red-50
    border: '#FECACA',     // 8×  — red-200
    text: '#DC2626',       // 21× — red-600
    dark: '#B91C1C',       // 1×  — red-700
  },
  warning: {
    base: '#F59E0B',       // 23× — amber-500
    bg: '#FFFBEB',         // 5×  — amber-50
    border: '#FEF3C7',     // 6×  — amber-100
    text: '#92400E',       // 5×  — amber-800
    dark: '#D97706',       // 9×  — amber-600
  },
  info: {
    base: '#3B82F6',       // 39× — blue-500
    bg: '#EFF6FF',         // 3×  — blue-50
    text: '#1D4ED8',       // 4×  — blue-700
  },

  // === Extra accents (low usage, kept for specific features) ===
  purple: {
    base: '#A855F7',       // 3×
    alt: '#8B5CF6',        // 7×
  },
  pink: '#EC4899',         // 3×

  // === Surfaces (named backgrounds) ===
  surface: {
    muted: '#F9FAFB',      // 12× — alias de gray.50
  },

  // === Absolutes ===
  white: '#FFFFFF',        // 166×
};

module.exports = {
  colors,
};
