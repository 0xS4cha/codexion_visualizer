/** @type {import('tailwindcss').Config} */

export default {
  content: ['./src/**/*.{mjs,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        shine: {
          '0%': { backgroundPosition: '100%' },
          '100%': { backgroundPosition: '-100%' },
        },
        'star-movement-bottom': {
          '0%': { transform: 'translate(0%, 0%)', opacity: '1' },
          '100%': { transform: 'translate(-100%, 0%)', opacity: '0' },
        },
        'star-movement-top': {
          '0%': { transform: 'translate(0%, 0%)', opacity: '1' },
          '100%': { transform: 'translate(100%, 0%)', opacity: '0' },
        },
        /* DarkVeil: apparition */
        'dark-veil-in': {
          '0%': { opacity: '0', transform: 'scale(0.995)' },
          '60%': { opacity: '0.6', transform: 'scale(1)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        /* DarkVeil: disparition */
        'dark-veil-out': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.995)' },
        },
      },
      animation: {
        gradient: 'gradient 8s linear infinite',
        shine: 'shine 5s linear infinite',
        'star-movement-bottom': 'star-movement-bottom linear infinite alternate',
        'star-movement-top': 'star-movement-top linear infinite alternate',
        /* classes: animate-dark-veil-in / animate-dark-veil-out */
        'dark-veil-in': 'dark-veil-in 240ms cubic-bezier(.2,.9,.2,1) forwards',
        'dark-veil-out': 'dark-veil-out 200ms cubic-bezier(.4,0,.2,1) forwards',
      },
    }
  },
  plugins: []
}
