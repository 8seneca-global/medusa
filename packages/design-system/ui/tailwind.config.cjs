/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@8medusa/ui-preset")],
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  darkMode: ["class", '[data-mode="dark"]'],
}
