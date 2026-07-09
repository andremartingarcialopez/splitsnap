/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#16A34A',
          hover: '#15803D',
          light: '#4ADE80',
          muted: '#DCFCE7',
        },
        accent: {
          DEFAULT: '#22C55E',
          hover: '#16A34A',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
        },
        destructive: {
          DEFAULT: '#EF4444',
          hover: '#DC2626',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F3F4F6',
        },
        foreground: {
          DEFAULT: '#111827',
          muted: '#6B7280',
        },
        border: {
          DEFAULT: '#E5E7EB',
          strong: '#D1D5DB',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-lg': '0 4px 12px -2px rgb(0 0 0 / 0.08)',
        glow: '0 0 24px -4px rgb(22 163 74 / 0.35)',
      },
    },
  },
  plugins: [],
};
