/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#172033',
        muted: '#7a8498',
        brand: '#635bff',
        canvas: '#f7f8fc',
        line: '#e8ebf2'
      },
      boxShadow: { soft: '0 12px 35px rgba(29, 42, 75, .06)' }
    }
  },
  plugins: []
};
