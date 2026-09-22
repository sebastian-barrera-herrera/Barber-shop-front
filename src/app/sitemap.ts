import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { path: '', priority: 1 },
    { path: '/servicios', priority: 0.9 },
    { path: '/reservar', priority: 0.9 },
    { path: '/profesionales', priority: 0.7 },
    { path: '/contacto', priority: 0.7 },
  ].map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority,
  }));
}
