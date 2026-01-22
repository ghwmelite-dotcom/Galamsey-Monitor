import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ghana: {
          red: '#CE1126',
          gold: '#FCD116',
          green: '#006B3F',
          black: '#000000',
        },
        water: {
          clean: '#3B82F6',
          moderate: '#F59E0B',
          polluted: '#EF4444',
        },
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'zoom-in-95': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'zoom-in-95': 'zoom-in-95 0.2s ease-out',
        'slide-up': 'slide-up 0.2s ease-out',
        'modal': 'zoom-in-95 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
