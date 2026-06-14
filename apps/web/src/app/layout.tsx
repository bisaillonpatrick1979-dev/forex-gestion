import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Forex Gestion — Système Multi-Agents IA',
  description: 'Plateforme de gestion forex automatisée avec agents IA spécialisés',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr-CA">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, background: '#0f0f14', color: '#e2e8f0' }}>
        {children}
      </body>
    </html>
  );
}
