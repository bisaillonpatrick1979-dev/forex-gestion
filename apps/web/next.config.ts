import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Packages que Next.js doit transpiler (monorepo workspace)
  transpilePackages: [
    '@forex/agents',
    '@forex/api-switcher',
    '@forex/logger',
    '@forex/oanda-client',
    '@forex/rag',
  ],
  // Journalisation Pino compatible edge runtime
  serverExternalPackages: ['pino', 'pino-pretty'],
};

export default nextConfig;
