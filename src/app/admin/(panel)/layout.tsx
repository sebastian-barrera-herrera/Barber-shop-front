import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/shell';
import { AdminTheme } from '@/components/admin/theme';

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <AdminTheme>
      <AdminShell>{children}</AdminShell>
    </AdminTheme>
  );
}
