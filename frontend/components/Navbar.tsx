'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/imvu', label: 'IMVU' },
  { href: '/rooms', label: 'Salas' },
  { href: '/bot', label: 'Bot' },
  { href: '/music', label: 'Música' },
  { href: '/licenses', label: 'Licencias' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-800 bg-slate-950/95 px-6 py-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-slate-100">
          <div className="rounded-2xl bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950">Arcana Realm</div>
          <span className="text-sm text-slate-400">Metaverse Studio</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-slate-300">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-2 text-sm transition hover:bg-slate-800 hover:text-white ${
                pathname === link.href ? 'bg-slate-800 text-white' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
