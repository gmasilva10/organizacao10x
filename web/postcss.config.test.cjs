// PostCSS config específico para testes com Vitest
// Resolve o problema de plugins como strings não serem resolvidos corretamente
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

