/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Identidade visual LJV Construção
        // Primário: Grafite profundo
        primary: {
          50:  '#f5f5f6',
          100: '#e6e6e8',
          200: '#c9cace',
          300: '#a8aab0',
          400: '#7e8189',
          500: '#606370',
          600: '#4a4d58',
          700: '#3c3f49',
          800: '#2e3038',
          900: '#1a1c22',
          950: '#111217',
        },
        // Acento: Ouro quente — qualidade, premium
        accent: {
          50:  '#fdf8ee',
          100: '#f9efd0',
          200: '#f2da9d',
          300: '#eac064',
          400: '#e4a83a',
          500: '#d4891a',
          600: '#b96c12',
          700: '#97500f',
          800: '#7c4013',
          900: '#683614',
          950: '#3c1c07',
        },
        // Neutros quentes (estende os tons padrão do Tailwind stone)
        stone: {
          50:  '#fafaf9',
          100: '#f5f5f0',
          200: '#e8e8e0',
          300: '#d0d0c8',
          400: '#a8a89f',
          500: '#79796e',
          600: '#5c5c52',
          700: '#44443c',
          800: '#2d2d27',
          900: '#1c1c18',
          950: '#0f0f0c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)',
        'modal': '0 20px 60px rgba(0,0,0,0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      }
    },
  },
  plugins: [],
}
