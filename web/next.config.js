﻿/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  productionBrowserSourceMaps: false,
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
