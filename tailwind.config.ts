import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf8ed',
          100: '#f9edcc',
          200: '#f3d994',
          300: '#edc45c',
          400: '#e8b436',
          500: '#d4af37',
          600: '#b8922a',
          700: '#967123',
          800: '#7a5a22',
          900: '#654a20',
        },
        gold: {
          50: '#fdf8ed',
          100: '#f9edcc',
          200: '#f3d994',
          300: '#edc45c',
          400: '#e8b436',
          500: '#d4af37',
          600: '#b8922a',
          700: '#967123',
          800: '#7a5a22',
          900: '#654a20',
        },
        luxury: {
          black: '#0a0a0a',
          dark: '#111111',
          charcoal: '#1a1a1a',
          gray: '#2a2a2a',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.07)',
        'glass-lg': '0 8px 32px 0 rgba(0, 0, 0, 0.12)',
        'glass-xl': '0 16px 48px 0 rgba(0, 0, 0, 0.15)',
        'float': '0 20px 60px -15px rgba(0, 0, 0, 0.3)',
        'float-lg': '0 25px 80px -20px rgba(0, 0, 0, 0.4)',
        'inner-glow': 'inset 0 1px 0 0 rgba(212, 175, 55, 0.1)',
        'apple': '0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.06)',
        'apple-lg': '0 2px 4px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.1)',
        'gold': '0 4px 20px -2px rgba(212, 175, 55, 0.3)',
        'gold-lg': '0 8px 40px -4px rgba(212, 175, 55, 0.4)',
        'gold-glow': '0 0 30px rgba(212, 175, 55, 0.2)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-reverse': 'float-reverse 7s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 4s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.6s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'blur-in': 'blur-in 0.4s ease-out',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'rotate-slow': 'rotate-slow 20s linear infinite',
        'gradient-x': 'gradient-x 6s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'float-reverse': {
          '0%, 100%': { transform: 'translateY(0px) rotate(2deg)' },
          '50%': { transform: 'translateY(-8px) rotate(-2deg)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'blur-in': {
          '0%': { filter: 'blur(8px)', opacity: '0' },
          '100%': { filter: 'blur(0px)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        'rotate-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
export default config
