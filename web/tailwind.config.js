/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        radar: {
          bg: '#0a0a0a',
          panel: '#1a1a1a',
          border: '#2a2a2a',
          cyan: '#00ffff',
          amber: '#ffaa00',
          red: '#ff0000',
          green: '#00ff00',
          dimmed: '#1a2a2a',
        }
      },
      fontFamily: {
        segment: ['DSEG7Classic', 'monospace'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'bolo-flash': 'boloFlash 0.5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        boloFlash: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        pulseGlow: {
          '0%, 100%': { filter: 'brightness(1)' },
          '50%': { filter: 'brightness(1.3)' },
        }
      }
    },
  },
  plugins: [],
}
