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
    dark: '#2A2E33',       // 253× — signature black (primary buttons, titles)
    accent: '#6366F1',     // 29×  — indigo (links, focus, active states)
    accentDark: '#4F46E5', // 7×   — indigo-600 (candidat fusion avec accent)
  },

  // === Neutral (slate scale) ===
  neutral: {
    50: '#F8FAFC',         // 58×
    100: '#F1F5F9',        // 33×
    200: '#E2E8F0',        // 116×
    300: '#CBD5E1',        // 24×
    400: '#94A3B8',        // 54×
    500: '#64748B',        // 116×
    600: '#475569',        // 12×
    800: '#1E293B',        // 75×
  },

  // === Gray (pure scale) ===
  gray: {
    50: '#F9FAFB',         // 46×
    100: '#F3F4F6',        // 79×
    200: '#E5E7EB',        // 98×
    300: '#D1D5DB',        // 65×
    400: '#9CA3AF',        // 135×
    500: '#6B7280',        // 159×
    600: '#4B5563',        // 34×
    700: '#374151',        // 43×
    800: '#1F2937',        // 32×
    900: '#111827',        // 22×  (candidat fusion avec gray.800)
  },

  // === Semantic ===
  success: {
    base: '#10B981',       // 67× — emerald-500
    bg: '#ECFDF5',         // 18× — emerald-50
    border: '#34D399',     // 12× — emerald-400
    text: '#047857',       // 11× — emerald-700
    dark: '#059669',       // 15× — emerald-600
  },
  error: {
    base: '#EF4444',       // 84× — red-500
    bg: '#FEF2F2',         // 43× — red-50
    border: '#FECACA',     // 11× — red-200
    text: '#DC2626',       // 22× — red-600
    dark: '#B91C1C',       // 4×  — red-700 (candidat suppression)
  },
  warning: {
    base: '#F59E0B',       // 31× — amber-500
    bg: '#FFFBEB',         // 7×  — amber-50
    border: '#FEF3C7',     // 14× — amber-100
    text: '#92400E',       // 10× — amber-800
    dark: '#D97706',       // 11× — amber-600
  },
  info: {
    base: '#3B82F6',       // 46× — blue-500
    bg: '#EFF6FF',         // 10× — blue-50
    text: '#1D4ED8',       // 6×  — blue-700
  },

  // === Status (order line state colors — pastel palette, distinct from semantic) ===
  status: {
    ready:      { badge: '#D7E3FC', bg: '#F5F8FE', text: '#1E3A5F' },
    pending:    { badge: '#F9F1C8', bg: '#FEFAF1', text: '#92400E' },
    served:     { badge: '#B7E1CC', bg: '#F0FAF5', text: '#065F46' },
    error:      { badge: '#F7BFB5', bg: '#FEF5F4', text: '#991B1B' },
    terminated: { badge: '#EBEBEB', bg: '#FAFAFA', text: '#374151' },
    draft:      { badge: '#D1D5DB', bg: '#FAFAFA', text: '#374151' },
  },

  // === Extra accents (low usage, kept for specific features) ===
  purple: {
    base: '#A855F7',       // 24×
    alt: '#8B5CF6',        // 12×
  },
  pink: '#EC4899',         // 10×

  // === Absolutes ===
  white: '#FFFFFF',        // 231×
};

module.exports = {
  colors,
};
