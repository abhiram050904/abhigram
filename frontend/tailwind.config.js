/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'ui-sans-serif']
      },
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#e8edff',
          200: '#d6deff',
          300: '#b4c3ff',
          400: '#8094ff',
          500: '#4d66ff',
          600: '#253dff',
          700: '#1326d1',
          800: '#101fa3',
          900: '#0e1c82'
        },
        accent: {
          50: '#fff5f8',
            100: '#ffe6ee',
            200: '#ffccdd',
            300: '#ff9cbb',
            400: '#ff6696',
            500: '#ff336f',
            600: '#e60057',
            700: '#bf0046',
            800: '#990038',
            900: '#7a002d'
        }
      },
      boxShadow: {
        'soft': '0 4px 16px -2px rgba(50,50,93,.12), 0 2px 8px -1px rgba(0,0,0,.08)',
        'elevated': '0 8px 28px -6px rgba(50,50,93,.25), 0 4px 16px -4px rgba(0,0,0,.12)'
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease both',
        'scale-in': 'scaleIn 0.35s ease both'
      },
      keyframes: {
        scaleIn: {
          '0%': { transform: 'scale(.94) translateY(4px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}

