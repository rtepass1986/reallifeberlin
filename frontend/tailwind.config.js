/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.5rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '2rem' }],
        xl: ['1.25rem', { lineHeight: '2rem' }],
        '2xl': ['1.5rem', { lineHeight: '2.5rem' }],
        '3xl': ['2rem', { lineHeight: '2.5rem' }],
        '4xl': ['2.5rem', { lineHeight: '3rem' }],
        '5xl': ['3rem', { lineHeight: '3.5rem' }],
        '6xl': ['4rem', { lineHeight: '1' }],
        '7xl': ['5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      container: {
        '2xl': '40rem',
      },
      colors: {
        // Reallife Berlin Corporate Colors
        reallife: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#b8ddff',
          300: '#7bc2ff',
          400: '#369eff',
          500: '#0d7aff', // Primary brand blue - warm and welcoming
          600: '#005ce6',
          700: '#0047b3',
          800: '#003786',
          900: '#002d5c',
        },
        // Warm accent color for highlights
        accent: {
          50: '#fef3f2',
          100: '#fde4e1',
          200: '#fbcec8',
          300: '#f8a8a0',
          400: '#f4756a',
          500: '#f04a3c', // Warm red accent
          600: '#de2e1f',
          700: '#b92316',
          800: '#981f15',
          900: '#7d1f17',
        },
        // Berlin-inspired colors (from flag)
        berlin: {
          red: '#FF0000',
          black: '#000000',
          white: '#FFFFFF',
        },
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        indigo: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
      },
    },
  },
  plugins: [],
}
