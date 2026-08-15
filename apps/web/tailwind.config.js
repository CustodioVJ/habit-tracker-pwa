/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4ffea',
          100: '#e6ffcd',
          200: '#ceff9f',
          300: '#b9ff66',
          400: '#9df534',
          500: '#7edb15',
          600: '#60af0b',
          700: '#4a850d',
          800: '#3d6911',
          900: '#345914',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
