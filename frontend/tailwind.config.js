/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,css}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#e8799a',
          hover: '#db6185',
          light: '#fbcfe8',
          muted: '#fce7f3',
        },
        accent: {
          DEFAULT: '#a78bfa',
          hover: '#8b5cf6',
          light: '#ddd6fe',
          muted: '#f3e8ff',
        },
        mint: {
          DEFAULT: '#5eead4',
          light: '#ccfbf1',
          muted: '#ecfdf5',
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
          muted: '#fdf2f8',
          elevated: '#ffffff',
          canvas: '#15121f',
          panel: '#1f1b2e',
          sunken: '#2a2438',
        },
        foreground: {
          DEFAULT: '#3d3349',
          muted: '#7c7189',
        },
        border: {
          DEFAULT: '#ecd9e8',
          strong: '#dbc4de',
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
        card: '0 4px 24px -8px rgb(232 121 154 / 0.1)',
        'card-lg': '0 8px 32px -12px rgb(61 51 73 / 0.12)',
        glow: '0 0 28px -6px rgb(232 121 154 / 0.4)',
        'glow-accent': '0 0 28px -6px rgb(167 139 250 / 0.4)',
        'glow-sm': '0 4px 16px -4px rgb(167 139 250 / 0.3)',
        glass: '0 4px 24px -8px rgb(61 51 73 / 0.07), inset 0 1px 0 rgb(255 255 255 / 0.45)',
        'glass-dark': '0 8px 32px -8px rgb(0 0 0 / 0.32), inset 0 1px 0 rgb(255 255 255 / 0.06)',
      },
      backgroundImage: {
        'gradient-surface-light':
          'linear-gradient(160deg, #fff7fb 0%, #fce7f3 22%, #f3e8ff 45%, #ecfdf5 68%, #e0f7fa 100%)',
        'gradient-surface-dark':
          'linear-gradient(160deg, #120f18 0%, #1a1526 28%, #1c1a30 52%, #152228 78%, #1a121c 100%)',
      },
    },
  },
  plugins: [],
};
