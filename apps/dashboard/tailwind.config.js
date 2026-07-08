/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        "surface": "#fcf9f8",
        "primary-container": "#ffd66b",
        "secondary-fixed": "#e9ddff",
        "surface-variant": "#e5e2e1",
        "surface-container-lowest": "#ffffff",
        "surface-tint": "#765b00",
        "secondary-fixed-dim": "#d0bcff",
        "on-secondary": "#ffffff",
        "on-error": "#ffffff",
        "secondary": "#665397",
        "tertiary-fixed": "#c3e8fd",
        "primary-fixed": "#ffdf93",
        "on-secondary-fixed": "#220a50",
        "tertiary-fixed-dim": "#a7cce0",
        "on-secondary-fixed-variant": "#4e3b7d",
        "surface-container": "#f0eded",
        "inverse-surface": "#313030",
        "surface-container-low": "#f6f3f2",
        "surface-container-highest": "#e5e2e1",
        "outline-variant": "#d0c5b1",
        "on-error-container": "#93000a",
        "tertiary-container": "#bbe0f5",
        "on-tertiary-fixed": "#001e2b",
        "on-primary": "#ffffff",
        "on-primary-fixed": "#241a00",
        "on-tertiary-container": "#416476",
        "error": "#ba1a1a",
        "surface-dim": "#dcd9d9",
        "surface-bright": "#fcf9f8",
        "inverse-primary": "#e9c259",
        "primary": "#765b00",
        "tertiary": "#3f6375",
        "on-surface-variant": "#4d4636",
        "on-surface": "#1c1b1b",
        "on-background": "#1c1b1b",
        "secondary-container": "#c8b2fe",
        "on-secondary-container": "#544184",
        "on-primary-container": "#775c00",
        "background": "#fcf9f8",
        "on-tertiary-fixed-variant": "#274b5c",
        "on-tertiary": "#ffffff",
        "inverse-on-surface": "#f3f0ef",
        "surface-container-high": "#eae7e7",
        "primary-fixed-dim": "#e9c259",
        "outline": "#7f7664",
        "error-container": "#ffdad6",
        "on-primary-fixed-variant": "#594400"
      },
      "borderRadius": {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      "spacing": {
        "margin-mobile": "16px",
        "gutter": "24px",
        "unit": "8px",
        "margin-desktop": "40px",
        "container-max-width": "1440px"
      },
      "fontFamily": {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
        "body-md": ["Plus Jakarta Sans", "sans-serif"],
        "headline-lg": ["Plus Jakarta Sans", "sans-serif"],
      },
      "fontSize": {
        "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "700" }],
        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "label-sm": ["12px", { "lineHeight": "16px", "fontWeight": "700" }],
        "label-md": ["14px", { "lineHeight": "20px", "fontWeight": "600" }],
        "headline-xl": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "800" }],
        "headline-lg-mobile": ["24px", { "lineHeight": "32px", "fontWeight": "700" }],
        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "700" }],
        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "500" }]
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        }
      }
    },
  },
  plugins: [],
}
