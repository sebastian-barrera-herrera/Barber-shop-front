'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { publicApi } from './api';
import { siteHref } from './site-paths';
import type { BusinessStyle } from './types';

interface Site {
  slug: string;
  style: BusinessStyle;
}

const SiteContext = createContext<Site | null>(null);

/** Qué empresa se está viendo: lo usan los componentes de cliente de su página. */
export function SiteProvider({ slug, style, children }: Site & { children: ReactNode }) {
  const value = useMemo(() => ({ slug, style }), [slug, style]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const site = useContext(SiteContext);
  if (!site) throw new Error('useSite() debe usarse dentro de <SiteProvider>');
  return useMemo(
    () => ({
      ...site,
      href: (path = '/') => siteHref(site.slug, path),
      api: publicApi(site.slug),
    }),
    [site],
  );
}
