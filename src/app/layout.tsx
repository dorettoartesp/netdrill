import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NetDrill',
  description: 'Repetição espaçada e fixação muscular de comandos',
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
