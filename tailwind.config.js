/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFDF5',
        foreground: '#1E293B',
        muted: '#F1F5F9',
        'muted-foreground': '#64748B',
        accent: '#8B5CF6',
        'accent-foreground': '#FFFFFF',
        secondary: '#F472B6',
        tertiary: '#FBBF24',
        quaternary: '#34D399',
        border: '#E2E8F0',
        input: '#FFFFFF',
        card: '#FFFFFF',
        ring: '#8B5CF6',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        heading: ['"Outfit"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'full': '9999px',
      },
    },
  },
  plugins: [],
}
