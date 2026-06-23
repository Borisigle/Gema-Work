import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gema Company Workflow',
  description: 'Sistema de gestión de equipos, asistencia y coreografías - Gema Company',
  manifest: '/manifest.json',
  themeColor: '#0a0a0f',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
