import tailwindcssAnimate from 'tailwindcss-animate';

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
        // Graphite surfaces (dark sections, overlays, dark buttons)
        nav: '#161617',
        nav2: '#1d1d1f',
        navline: '#424245',
        'nav-fg': '#f5f5f7',
        'nav-cyan': '#2997ff',
        'nav-cyan-ink': '#FFFFFF',
        'nav-cart': '#0071e3',
        'nav-cart-ink': '#FFFFFF',
        'announce-bg': '#f5f5f7',
        'announce-ink': '#1d1d1f',
        'maint-bg': '#d70015',

        // ---- shadcn/ui token bridge (mapped onto MY tokens, never a second palette) ----
        // NOTE: shadcn's `muted` and `accent` mean "subtle background/hover"; my `muted`
        // and `accent` mean "secondary text" and "brand blue". Those two shadcn roles are
        // exposed under the `ui-` prefix below instead, so no token changes meaning.
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        'card-foreground': 'rgb(var(--card-foreground) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'primary-foreground': 'rgb(var(--primary-foreground) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        destructive: 'rgb(var(--destructive) / <alpha-value>)',
        'destructive-foreground': 'rgb(var(--destructive-foreground) / <alpha-value>)',
        // ui-* roles used by src/components/ui/**
        'ui-bg': 'rgb(var(--ui-bg) / <alpha-value>)',
        'ui-fg': 'rgb(var(--ui-fg) / <alpha-value>)',
        'ui-card': 'rgb(var(--ui-card) / <alpha-value>)',
        'ui-card-fg': 'rgb(var(--ui-card-fg) / <alpha-value>)',
        'ui-muted': 'rgb(var(--ui-muted) / <alpha-value>)',
        'ui-muted-fg': 'rgb(var(--ui-muted-fg) / <alpha-value>)',
        'ui-line': 'rgb(var(--ui-line) / <alpha-value>)',
        'ui-primary': 'rgb(var(--ui-primary) / <alpha-value>)',
        'ui-primary-fg': 'rgb(var(--ui-primary-fg) / <alpha-value>)',
        'ui-accent': 'rgb(var(--ui-accent) / <alpha-value>)',
        'ui-accent-fg': 'rgb(var(--ui-accent-fg) / <alpha-value>)',
        'ui-destructive': 'rgb(var(--ui-destructive) / <alpha-value>)',
        'ui-success': 'rgb(var(--ui-success) / <alpha-value>)',
        'ui-warning': 'rgb(var(--ui-warning) / <alpha-value>)',
        'ui-ring': 'rgb(var(--ui-ring) / <alpha-value>)',

        // ---- Neutral scale: graphite / silver ----
        slate: {
          50: '#fbfbfd', 100: '#f5f5f7', 200: '#e8e8ed', 300: '#d2d2d7', 400: '#86868b',
          500: '#6e6e73', 600: '#515154', 700: '#424245', 800: '#2c2c2e', 900: '#1d1d1f', 950: '#111113',
        },
        // ---- Brand blue ----
        blue: {
          50: '#f2f8fe', 100: '#e3f0fc', 200: '#c2dffa', 300: '#8fc4f5', 400: '#2997ff',
          500: '#0071e3', 600: '#0071e3', 700: '#0066cc', 800: '#004f9f', 900: '#1d1d1f', 950: '#161617',
        },
        // ---- System semantic colours ----
        emerald: {
          50: '#eefaf1', 100: '#d9f4e0', 200: '#b3e8c2', 300: '#7fd898', 400: '#30d158',
          500: '#34c759', 600: '#248a3d', 700: '#1d7032', 800: '#165a28', 900: '#0f411d', 950: '#082a12',
        },
        rose: {
          50: '#fff2f1', 100: '#ffe3e0', 200: '#ffc7c2', 300: '#ff9c94', 400: '#ff6961',
          500: '#ff3b30', 600: '#d70015', 700: '#b3000f', 800: '#8c000c', 900: '#6b0009', 950: '#450006',
        },
        amber: {
          50: '#fff8eb', 100: '#ffefd0', 200: '#ffdd9e', 300: '#ffc86b', 400: '#ffb340',
          500: '#ff9f0a', 600: '#c77700', 700: '#9f5f00', 800: '#7a4900', 900: '#5a3600', 950: '#3a2200',
        },
      },
      // ---- Design tokens (mirrors the CSS variables in src/index.css) ----
      borderRadius: { ctl: 'var(--r-md)', card: 'var(--r-lg)', tile: 'var(--r-xl)', ui: 'var(--ui-radius)', 'ui-lg': 'var(--ui-radius-lg)' },
      boxShadow: { 'tok-1': 'var(--shadow-1)', 'tok-2': 'var(--shadow-2)', 'tok-3': 'var(--shadow-3)' },
      maxWidth: { container: 'var(--container)', narrow: 'var(--container-narrow)' },
      zIndex: { nav: '40', menus: '70', mega: '70', sheet: '80', modal: '90', toast: '100' },
      transitionTimingFunction: { apple: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      transitionDuration: { fast: '140ms', base: '240ms', slow: '420ms' },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', '"SF Arabic"',
          'Inter', '"IBM Plex Sans Arabic"', 'Cairo', 'system-ui', '"Segoe UI"', 'Roboto', 'sans-serif',
        ],
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
