/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better error detection
  reactStrictMode: true,
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Fix for potential module resolution issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
  
  // Handle images
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/api/annotations/image/**',
      },
    ],
  },
  
  // Suppress ESLint warnings during builds
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Suppress TypeScript errors during builds (if using TypeScript)
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
