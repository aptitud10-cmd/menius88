import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#effefb', 100: '#c7fff2', 200: '#90ffe5',
          300: '#51f7d5', 400: '#1de4c0', 500: '#05c8a7',
          600: '#00a189', 700: '#058070', 800: '#0a655a',
          900: '#0d544b', 950: '#00332f',
        },
        gold: {
          50: '#fdfaf3',
          100: '#fbf0d4',
          200: '#f6dfa8',
          300: '#f0c86d',
          400: '#e9ad3a',
          500: '#e09418',
          600: '#c87410',
          700: '#a65410',
          800: '#884214',
          900: '#703714',
          950: '#411b06',
        },
        charcoal: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#1a1a1a',
          950: '#0d0d0d',
        },
      },
      borderRadius: { xl: '14px', '2xl': '18px', '3xl': '24px' },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
