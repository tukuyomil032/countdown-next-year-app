/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', '"Manrope"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        midnight: '#050816',
        'glow-cyan': '#67e8f9',
        'glow-purple': '#c084fc',
        'glow-amber': '#fbbf24',
      },
      boxShadow: {
        neon: '0 0 30px rgba(103,232,249,0.35)',
      },
    },
  },
  plugins: [],
}
