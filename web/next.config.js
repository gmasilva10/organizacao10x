/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  productionBrowserSourceMaps: false,
  // Otimização de preloading para reduzir avisos
  experimental: {
    // optimizeCss: true, // Desabilitado - requer biblioteca 'critters'
    // Desabilitar preload automático de CSS não crítico
    optimizePackageImports: ['@/components', '@/lib'],
    // Otimizar carregamento de CSS
    cssChunking: 'strict',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kkxlztopdmipldncduvj.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/app/relacionamento',
        destination: '/app/relationship',
        permanent: true,
      },
      {
        source: '/app/relacionamento/:path*',
        destination: '/app/relationship/:path*',
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/relacionamento/:path*',
        destination: '/api/relationship/:path*',
      },
    ]
  },
  // Configuração de headers para melhor controle de cache
  async headers() {
    return [
      {
        source: '/_next/static/css/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  // Configuração de webpack para otimizar CSS
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Otimizar CSS em produção
      config.optimization.splitChunks.cacheGroups.styles = {
        name: 'styles',
        test: /\.(css|scss|sass)$/,
        chunks: 'all',
        enforce: true,
      }
    }
    return config
  },
  // experimental: {
  //   turbo: {
  //     rules: {
  //       '*.svg': {
  //         loaders: ['@svgr/webpack'],
  //         as: '*.js',
  //       },
  //     },
  //   },
  // },
};

module.exports = nextConfig;
