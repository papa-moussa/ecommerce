import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          ivory: '#F5F1E8',
          gold: '#C9A961',
          ink: '#0F0F10',
        },
        notion: {
          bg: '#FFFFFF',
          sidebar: '#F7F7F5',
          hover: '#EFEFEF',
          border: '#E9E9E7',
          text: '#37352F',
          textSecondary: '#787774',
        },
      },
    },
  },
  plugins: [],
};

export default config;
