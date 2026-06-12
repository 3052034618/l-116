/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        teal: {
          50: "#f0fdf9",
          100: "#ccfbef",
          200: "#99f6de",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#0D7377",
          600: "#0a5c5f",
          700: "#084547",
          800: "#062e30",
          900: "#041718",
        },
        accent: {
          DEFAULT: "#E8863A",
          light: "#F0A862",
          dark: "#C46A22",
        },
        surface: {
          DEFAULT: "#F5F7FA",
          card: "#FFFFFF",
        },
        ink: {
          DEFAULT: "#1A2332",
          secondary: "#5A6577",
          muted: "#8B95A5",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
