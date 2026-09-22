'use client';

import { useBusiness } from '@/lib/admin/queries';
import { resolveTheme, themeCss } from '@/lib/theme';

/**
 * El panel se viste como el negocio: misma paleta y misma tipografía que su página.
 * Mientras carga se queda con el tema neutro del documento.
 */
export function AdminTheme({ children }: { children: React.ReactNode }) {
  const business = useBusiness();
  const style = business.data?.style;
  if (!style) return <>{children}</>;
  return (
    <div data-site-style={style === 'BARBER' ? 'barber' : 'spa'} className="contents">
      <style>{themeCss(resolveTheme(business.data?.settings.branding, style))}</style>
      {children}
    </div>
  );
}
