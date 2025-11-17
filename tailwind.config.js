export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0c0c0c',
        charcoal: '#111111',
        flame: '#b22222',
        ember: '#c1272d',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 24px 80px rgba(0,0,0,0.35)',
        glow: '0 10px 30px rgba(193,39,45,0.35)',
      },
    },
  },
  plugins: [],
}
