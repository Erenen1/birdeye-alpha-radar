import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0d1117", // Görseldeki karanlık arka plan
        surface: "#161b22",    // Kart ve tablo arka planları
        border: "#30363d",     // Çerçeve renkleri
        primary: "#8b5cf6",    // Mor vurgu (Trending)
        success: "#10b981",    // Yeşil vurgu (High Momentum)
        danger: "#ef4444",     // Kırmızı vurgu (High Risk)
        warning: "#f59e0b",    // Sarı vurgu (Investigate/Avoid)
        info: "#3b82f6",       // Mavi vurgu (New Listings)
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
