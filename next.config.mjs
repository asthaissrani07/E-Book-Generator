/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    VITE_GROQ_API_KEY: process.env.VITE_GROQ_API_KEY || '',
    VITE_POLLINATIONS_API_KEY: process.env.VITE_POLLINATIONS_API_KEY || '',
  },
  experimental: {
    serverComponentsExternalPackages: ['pdfjs-dist', 'mjml', 'bullmq', 'ioredis', 'puppeteer'],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

export default nextConfig;
