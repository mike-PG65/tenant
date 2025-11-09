/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          100: '#f3f4f6',
          300: '#d1d5db',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
        },
        blue: { 600: '#2563eb', 700: '#1d4ed8' },
        green: { 700: '#15803d' },
        red: { 600: '#dc2626' },
        yellow: { 600: '#ca8a04' },
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
    disableColorOpacityUtilitiesByDefault: true,
  },
};
