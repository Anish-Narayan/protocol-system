/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        main: ['var(--font-main)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        // Abstracted Colors
        background: 'var(--bg-main)',
        surface: 'var(--bg-surface)',
        
        // "Theme Primary" (Cyan in SciFi, Gold/Lapis in Egypt)
        primary: {
          DEFAULT: 'var(--col-primary)', // Border color
          dim: 'var(--col-primary-dim)', // Backgrounds
          text: 'var(--col-primary-text)', // Text Color
        },
        
        // "Theme Danger" (Red)
        danger: {
          DEFAULT: 'var(--col-danger)',
          dim: 'var(--col-danger-dim)',
        },

        text: {
            main: 'var(--col-text-main)',
            muted: 'var(--col-text-muted)',
        }
      },
      borderWidth: {
        theme: 'var(--border-width)',
      },
      borderRadius: {
        theme: 'var(--corner-radius)',
      }
    },
  },
  plugins: [],
}