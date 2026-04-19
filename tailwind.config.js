const { hairlineWidth } = require('nativewind/theme');
const { shadowsCss } = require('./theme/shadows.tokens');
const { colors } = require('./theme/colors.tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: false, // Dark mode disabled
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Mona-Sans', 'system-ui', 'sans-serif']
      },
      colors: {
        // === Global design tokens (theme/colors.tokens.js) ===
        brand: colors.brand,
        neutral: colors.neutral,
        gray: colors.gray,
        success: {
          DEFAULT: colors.success.base,
          foreground: colors.success.text,
          bg: colors.success.bg,
          border: colors.success.border,
          dark: colors.success.dark,
        },
        error: {
          DEFAULT: colors.error.base,
          foreground: colors.error.text,
          bg: colors.error.bg,
          border: colors.error.border,
          dark: colors.error.dark,
        },
        warning: {
          DEFAULT: colors.warning.base,
          foreground: colors.warning.text,
          bg: colors.warning.bg,
          border: colors.warning.border,
          dark: colors.warning.dark,
        },
        info: colors.info,
        surface: colors.surface,

        // === Radix/shadcn HSL variables (kept for existing ui primitives) ===
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      boxShadow: {
        left: shadowsCss.left,
        right: shadowsCss.right,
        top: shadowsCss.top,
        bottom: shadowsCss.bottom,
        all: shadowsCss.all,
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
    borderRadius: {
      'none': '0',
      'sm': '0.125rem',
      'md': '0.375rem',
      DEFAULT: '1.2rem',
      'lg': '1.2rem',
      'full': '9999px',
      'xl': '12px',
    },
  },
  plugins: [require('tailwindcss-animate')],
};
