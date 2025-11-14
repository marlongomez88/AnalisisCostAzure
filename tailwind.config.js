/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores corporativos de AYURA (puedes personalizarlos)
        'ayura-blue': '#2563eb',
        'ayura-dark': '#1e40af',
      },
    },
  },
  plugins: [],
}
