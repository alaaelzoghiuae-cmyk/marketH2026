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
        nav: '#050914',
        nav2: '#0B1224',
        navline: '#1E2D4A',
        'nav-fg': '#F8FAFC',
        'nav-cyan': '#3B82F6',
        'nav-cyan-ink': '#FFFFFF',
        'nav-cart': '#2563EB',
        'nav-cart-ink': '#FFFFFF',
        'announce-bg': '#fbbf24',
        'announce-ink': '#2b1d00',
        'maint-bg': '#e11d48',
      },
      fontFamily: {
        sans: ['Cairo', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
