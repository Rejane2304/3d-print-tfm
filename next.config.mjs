/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 16+ uses ESLint 9 flat config - no eslint key here
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
      },
      {
        protocol: 'https',
        hostname: '*.example.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Puppeteer configuration for serverless
  serverRuntimeConfig: {
    puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '',
  },
  // API configuration
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default nextConfig;
