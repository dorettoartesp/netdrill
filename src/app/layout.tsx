import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'NetDrill',
  description: 'Repetição espaçada e fixação muscular de comandos',
};

/**
 * Mobile-optimized viewport settings.
 * Resizes content for on-screen virtual keyboards and keeps pinch-zoom available (WCAG 1.4.4);
 * iOS focus zoom is prevented by the 16px form-field rule in globals.css instead.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-terminal-bg text-terminal-text antialiased">
        {children}
      </body>
    </html>
  );
}
