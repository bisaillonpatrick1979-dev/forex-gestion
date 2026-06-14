import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Packages du monorepo à transpiler
  transpilePackages: [
    '@forex/agents',
    '@forex/api-switcher',
    '@forex/logger',
    '@forex/oanda-client',
    '@forex/rag',
    '@forex/scraper',
    '@forex/supabase',
  ],
  // Pino n'est pas compatible Edge Runtime — garder en Node.js runtime
  serverExternalPackages: ['pino', 'pino-pretty'],
};

export default nextConfig;
