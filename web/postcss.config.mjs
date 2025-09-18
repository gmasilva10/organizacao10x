// PostCSS config compatível com TailwindCSS v3.x
// A Vercel está falhando ao resolver '@tailwindcss/postcss' (usado no v4).
// Usamos a configuração clássica com 'tailwindcss' e 'autoprefixer'.
const config = {
  plugins: ["tailwindcss", "autoprefixer"],
};

export default config;
