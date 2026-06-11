import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sora: ['Sora', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        orbitron: ['Orbitron', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 80px rgba(56, 189, 248, 0.18)',
      },
      backgroundImage: {
        'grid-lines': 'radial-gradient(circle at top left, rgba(139,92,246,0.08), transparent 40%), radial-gradient(circle at bottom right, rgba(56,189,248,0.06), transparent 24%)',
      },
    },
  },
  plugins: [],
};

export default config;
