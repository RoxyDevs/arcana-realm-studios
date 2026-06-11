import './globals.css';
import type { Metadata } from 'next';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'Arcana Realm Studios',
  description: 'Building Immersive Virtual Worlds with Arcana Music Bot for IMVU rooms.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#050816] text-white">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
