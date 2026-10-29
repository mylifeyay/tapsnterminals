import aspectRatio from '@tailwindcss/aspect-ratio'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        crt: {
          bg: '#121212',
          panel: '#1a1b26',
          shell: '#1e1e2e',
          line: '#2a2b3d',
          green: '#00ff66',
          dim: '#00a844',
          amber: '#ffb000',
          blue: '#3b82f6',
          red: '#ff4d4d',
          text: '#c9d1d9',
          muted: '#7d8590',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        pixel: ['"Press Start 2P"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(0,255,102,0.35), 0 0 12px rgba(0,255,102,0.15)',
      },
    },
  },
  plugins: [aspectRatio],
}
