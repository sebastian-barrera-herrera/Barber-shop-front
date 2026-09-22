import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminProviders } from '@/components/admin/providers';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

/** Entrar, registrarse y recuperar la contraseña: necesitan la sesión del panel. */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return <AdminProviders>{children}</AdminProviders>;
}
