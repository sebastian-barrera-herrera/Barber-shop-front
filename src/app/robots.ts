import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    // Las páginas de citas son privadas (enlace con token) y el panel no se indexa.
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/*/cita/', '/admin', '/restablecer'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
