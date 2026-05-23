/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F6F1E8',
        sage: {
          DEFAULT: '#3F5B4A',
          light: '#A8B5A0',
        },
        terracotta: {
          DEFAULT: '#C97B5E',
          dark: '#B0664A',
        },
        ink: '#2A3B4C',
        offwhite: '#FFFDF8',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Karla', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
    },
  },
  plugins: [],
}
