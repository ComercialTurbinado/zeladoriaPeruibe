/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00346f',
        'primary-container': '#004a99',
        'primary-fixed': '#d7e2ff',
        'primary-fixed-dim': '#abc7ff',
        secondary: '#006c47',
        'secondary-container': '#8af5be',
        surface: '#f8f9fb',
        'surface-container': '#eceef0',
        'surface-container-low': '#f2f4f6',
        'surface-container-high': '#e6e8ea',
        'surface-container-highest': '#e0e3e5',
        'surface-container-lowest': '#ffffff',
        'on-surface': '#191c1e',
        'on-surface-variant': '#424751',
        'on-primary': '#ffffff',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#00714b',
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        outline: '#737783',
        'outline-variant': '#c2c6d3',
        tertiary: '#293743',
        'tertiary-container': '#404e5a',
      },
      fontFamily: {
        headline: ['Public Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
