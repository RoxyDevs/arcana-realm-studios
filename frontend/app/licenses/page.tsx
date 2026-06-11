'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/licenses')
      .then(setLicenses)
      .catch(() => setLicenses([]));
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-lg shadow-slate-950/40">
          <h1 className="text-3xl font-semibold text-white">Licencias</h1>
          <p className="mt-3 text-slate-400">Gestiona tus licencias activas y el estado de tu suscripción.</p>

          <div className="mt-8 space-y-4">
            {licenses.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-slate-400">
                No se encontraron licencias activas.
              </div>
            ) : (
              licenses.map((license) => (
                <div key={license.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
                  <p className="text-lg font-semibold text-white">Código: {license.code}</p>
                  <p className="mt-2 text-slate-400">Estado: {license.active ? 'Activa' : 'Inactiva'}</p>
                  <p className="mt-1 text-slate-400">Vence: {new Date(license.expiresAt).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>

          {message ? <p className="mt-6 text-sm text-rose-400">{message}</p> : null}
        </div>
      </section>
    </main>
  );
}
