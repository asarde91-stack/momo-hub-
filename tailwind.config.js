/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#1a1916',
          deep: '#0f0e0c',
        },
        terracotta: {
          DEFAULT: '#C94F32',
          50: '#FEF2EE',
          100: '#FDDDD5',
          200: '#FBB5A5',
          300: '#F28C75',
          400: '#E06A4F',
          500: '#C94F32',
          600: '#A73E27',
          700: '#85311E',
          800: '#632516',
          900: '#41190E',
        },
        cream: {
          DEFAULT: '#FAEDDD',
          50: '#FDFCFA',
          100: '#FAF6F0',
          200: '#FAEDDD',
          300: '#EDD9C1',
          400: '#E2C4A0',
          500: '#D5AE7F',
        },
        sand: {
          DEFAULT: '#D4A96A',
          50: '#FBF5EC',
          100: '#F5E8D1',
          200: '#EDD5AF',
          300: '#D4A96A',
          400: '#C9A06E',
          500: '#B78752',
        },
        gold: {
          DEFAULT: '#C8A44E',
          light: '#E8D48B',
        },
        primary: '#C94F32',
        secondary: '#1a1916',
        accent: '#D4A96A',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'momo-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 10 L20 25 L10 40 L20 40 L30 25 L40 40 L50 40 L40 25 Z' fill='%23C94F3210' stroke='%23C94F3215' stroke-width='0.5'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
