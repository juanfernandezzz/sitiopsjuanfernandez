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
          // Derivado de accesibilidad (C24): fondo de CTA con texto cream.
          // 4.62:1 sobre cream y 5.12:1 sobre offwhite (AA texto normal).
          // No reemplaza al terracota de marca: solo rellenos con texto encima.
          deep: '#A4583B',
        },
        // alias un-t para los componentes C2+
        terracota: '#C97B5E',
        ink: '#2A3B4C',
        offwhite: '#FFFDF8',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Karla', 'system-ui', 'sans-serif'],
        body: ['Karla', 'system-ui', 'sans-serif'],
        wordmark: ['"EB Garamond"', 'Georgia', 'serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
    },
  },
  plugins: [],
}
