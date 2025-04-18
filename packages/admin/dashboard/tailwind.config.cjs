const path = require("path")

// get the path of the dependency "@8medusa/ui"
const medusaUI = path.join(
  path.dirname(require.resolve("@8medusa/ui")),
  "**/*.{js,jsx,ts,tsx}"
)

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@8medusa/ui-preset")],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", medusaUI],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
}
