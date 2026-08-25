import Link from 'next/link';

import { requireStaff } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStaff();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-espresso-500/70">
            Panel administrativo
          </p>
          <nav className="mt-2 flex items-center gap-5">
            <Link
              href="/dashboard/admin"
              className="text-sm font-medium text-espresso-700 hover:text-gold-600"
            >
              Resumen
            </Link>
            <Link
              href="/dashboard/admin/insurance"
              className="text-sm font-medium text-espresso-700 hover:text-gold-600"
            >
              Seguros
            </Link>
            <Link
              href="/dashboard/admin/settings"
              className="text-sm font-medium text-espresso-700 hover:text-gold-600"
            >
              Comisión
            </Link>
          </nav>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-espresso-500 hover:text-espresso-700"
        >
          ← Volver al dashboard
        </Link>
      </div>
      {children}
    </div>
  );
}
