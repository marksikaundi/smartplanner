/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        accent: {
          50: "#F2F5FF",
          100: "#E5EBFF",
          500: "#5B6DFF",
          600: "#4F5FE0",
        },
      },
      borderRadius: {
        xl2: "20px",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
