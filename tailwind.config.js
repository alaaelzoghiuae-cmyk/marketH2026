/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        surface2: 'rgb(var(--surface2) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-ink': 'rgb(var(--accent-ink) / <alpha-value>)',
        'accent-text': 'rgb(var(--accent-text) / <alpha-value>)',
        go: 'rgb(var(--go) / <alpha-value>)',
        'go-ink': 'rgb(var(--go-ink) / <alpha-value>)',
        nav: '#0b1620',
        nav2: '#142431',
        navline: '#223647',
        'nav-fg': '#e7f0f5',
        'nav-cyan': '#22d3ee',
        'nav-cyan-ink': '#031a20',
        'nav-cart': '#10b981',
        'nav-cart-ink': '#03150f',
        'announce-bg': '#fbbf24',
        'announce-ink': '#2b1d00',
        'maint-bg': '#be123c',
      },
    },
  },
  plugins: [],
}
