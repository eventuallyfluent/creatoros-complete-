/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Maps to CSS variables — single source of truth
        'bg-base':      'var(--bg-base)',
        'bg-surface':   'var(--bg-surface)',
        'bg-elevated':  'var(--bg-elevated)',
        'brand':        'var(--brand)',
        'brand-hover':  'var(--brand-hover)',
        'accent':       'var(--accent)',
        'gold':         'var(--accent-gold)',
        'text-primary': 'var(--text-primary)',
        'text-secondary':'var(--text-secondary)',
        'text-muted':   'var(--text-muted)',
        'border-color': 'var(--border)',
        'success':      'var(--success)',
        'warning':      'var(--warning)',
        'danger':       'var(--danger)',
      },
      fontFamily: {
        display: ['Cinzel Decorative', 'serif'],
        sans:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '20px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      maxWidth: {
        'platform': '1280px',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, var(--brand), var(--accent))',
        'hero-glow': 'radial-gradient(ellipse at center top, rgba(123,47,190,0.25) 0%, transparent 70%)',
        'gold-gradient': 'linear-gradient(135deg, var(--accent-gold), #C49040)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease both',
        'fade-in': 'fadeIn 0.3s ease both',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          'from': { opacity: '0', transform: 'translateY(16px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to':   { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
