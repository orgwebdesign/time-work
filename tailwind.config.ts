
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Inter', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--primary))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
          border: 'hsl(var(--border))',
          ring: 'hsl(var(--ring))',
          accent: 'hsl(var(--accent))',
          'accent-foreground': 'hsl(var(--accent-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      backgroundImage: {
        'sunny-day': 'linear-gradient(to top, #a1c4fd, #c2e9fb)',
        'cloudy-day': 'linear-gradient(to right, #d2d2d2, #cfd9df)',
        'rainy-day': 'linear-gradient(to top, #6a85b6, #bac8e0)',
        'clear-night': 'linear-gradient(to right, #232526, #414345)',
        'partly-cloudy-day': 'linear-gradient(to right, #e0eafc, #cfdef3)',
        'partly-cloudy-night': 'linear-gradient(to right, #0f2027, #203a43, #2c5364)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'border-spin': {
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
        'alarm-flash': {
          '0%, 100%': { backgroundColor: 'hsl(var(--card))' },
          '50%': { backgroundColor: 'hsl(var(--primary) / 0.2)' },
        },
        'spin-slow': {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
        'gradient-pan': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'gentle-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'fade-in-slide-right': {
            '0%': { opacity: '0', transform: 'translateX(-10px)' },
            '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-up-second': {
            '0%': { transform: 'translateY(100%)', opacity: '0' },
            '10%, 90%': { transform: 'translateY(0)', opacity: '1' },
            '100%': { transform: 'translateY(-100%)', opacity: '0' },
        },
        'calm-pulse': {
          '50%': {
            opacity: '0.7',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'border-spin': 'border-spin 7s linear infinite',
        'alarm-flash': 'alarm-flash 1.5s ease-in-out infinite',
        'spin-slow': 'spin-slow 20s linear infinite',
        'gradient-pan': 'gradient-pan 20s ease infinite',
        'gentle-float': 'gentle-float 3s ease-in-out infinite',
        'fade-in-slide-right': 'fade-in-slide-right 0.8s ease-out forwards',
        'slide-up-second': 'slide-up-second 1s ease-in-out forwards',
        'calm-pulse': 'calm-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

    
