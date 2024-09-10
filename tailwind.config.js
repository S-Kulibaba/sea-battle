/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                'fo': ['Fjalla One', 'sans-serif'],
              }
        },
    },
    plugins: [],
  }
  