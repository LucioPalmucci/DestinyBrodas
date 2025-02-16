/** @type {import('tailwindcss').Config} */

module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                Inter: ['Inter'],
                neuehaas: ['Neue Haas Grotesk Text Pro', 'sans-serif'],
            },
        },
    },
    plugins: [],
}