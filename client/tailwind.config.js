/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080D13',
        surface: '#111923',
        surface2: '#19232E',
        elevated: '#22303C',
        ink: '#F4F7FA',
        muted: '#94A5B5',
        accent: '#D9F26A',
        ok: '#65D6A5',
        caution: '#F2BA68',
        critical: '#F27676',
        line: '#293744',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderColor: {
        DEFAULT: '#293744',
      },
      borderRadius: {
        panel: '3px',
      },
      fontSize: {
        '2xs': ['10px', '14px'],
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        sweep: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(250%)' },
        },
      },
      animation: {
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        sweep: 'sweep 2.6s linear infinite',
      },
    },
  },
  plugins: [],
};
