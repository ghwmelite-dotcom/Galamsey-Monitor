import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Required for Cloudflare Pages deployment
  images: {
    // Use custom loader for R2 images
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
  },

  // Experimental settings for edge runtime compatibility
  experimental: {
    // Enable server actions on edge
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
