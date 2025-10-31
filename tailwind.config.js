module.exports = {
  content: [
    "./public/**/*.{html,js}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'pathsafe-blue': '#00a8ff',
        'pathsafe-purple': '#9c88ff',
        'pathsafe-green': '#44ff88',
        'danger-red': '#ff4757',
        'warning-orange': '#ffa502',
        'safe-green': '#26de81'
      },
      fontFamily: {
        'display': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        glow: {
          '0%': { opacity: '0.5' },
          '100%': { opacity: '1' }
        }
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
}
