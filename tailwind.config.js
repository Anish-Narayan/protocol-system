/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Rajdhani', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        background: '#030303',
        surface: '#0a0a0a',
        // Sci-Fi Palette
        cyan: {
          400: '#22d3ee', // Neon Blue
          500: '#06b6d4',
          800: '#155e75',
          900: '#083344',
        },
        crimson: {
          500: '#ef4444', // Neon Red
          900: '#450a0a',
        },
        acid: {
          500: '#84cc16', // Toxic Green
        }
      },
      boxShadow: {
        'neon-blue': '0 0 5px theme("colors.cyan.500"), 0 0 20px theme("colors.cyan.900")',
        'neon-red': '0 0 5px theme("colors.crimson.500"), 0 0 20px theme("colors.crimson.900")',
      },
    },
  },
  plugins: [],
}