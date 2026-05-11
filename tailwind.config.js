/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        body: ["'DM Sans'", "sans-serif"],
      },
      colors: {
        brand: { 50:"#f0f9ff",100:"#e0f2fe",200:"#bae6fd",300:"#7dd3fc",400:"#38bdf8",500:"#0ea5e9",600:"#0284c7",700:"#0369a1",800:"#075985",900:"#0c4a6e" },
        gold: { 400:"#fbbf24",500:"#f59e0b",600:"#d97706" },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: { from:{opacity:0}, to:{opacity:1} },
        slideUp: { from:{opacity:0,transform:"translateY(20px)"}, to:{opacity:1,transform:"translateY(0)"} },
        scaleIn: { from:{opacity:0,transform:"scale(0.95)"}, to:{opacity:1,transform:"scale(1)"} },
      },
    },
  },
  plugins: [],
};
