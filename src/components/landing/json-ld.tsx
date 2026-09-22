import type { BusinessProfile, CatalogGroup } from '@/lib/types';

const SCHEMA_TYPE: Record<BusinessProfile['type'], string> = {
  BARBERSHOP: 'HairSalon',
  SALON: 'HairSalon',
  SPA: 'DaySpa',
  NAILS: 'NailSalon',
  AESTHETICS: 'BeautySalon',
  OTHER: 'HealthAndBeautyBusiness',
};

const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Datos estructurados (schema.org) para que Google muestre horario, dirección y servicios. */
export function BusinessJsonLd({
  business,
  catalog,
  url,
}: {
  business: BusinessProfile;
  catalog: CatalogGroup[];
  url: string;
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': SCHEMA_TYPE[business.type],
    name: business.name,
    description: business.description ?? undefined,
    url,
    telephone: business.phone ?? undefined,
    email: business.email ?? undefined,
    image: business.heroImageUrl ?? business.logoUrl ?? undefined,
    priceRange: '$$',
    address: business.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: business.address,
          addressLocality: business.city,
          addressCountry: business.country,
        }
      : undefined,
    geo:
      business.latitude != null
        ? { '@type': 'GeoCoordinates', latitude: business.latitude, longitude: business.longitude }
        : undefined,
    openingHoursSpecification: business.openingHours
      .filter((d) => !d.closed)
      .map((d) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: DAY[d.weekday],
        opens: d.open,
        closes: d.close,
      })),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios',
      itemListElement: catalog.map((g) => ({
        '@type': 'OfferCatalog',
        name: g.name,
        itemListElement: g.services.map((s) => ({
          '@type': 'Offer',
          price: (s.priceCents / 100).toFixed(0),
          priceCurrency: business.currency,
          itemOffered: {
            '@type': 'Service',
            name: s.name,
            description: s.description ?? undefined,
          },
        })),
      })),
    },
    sameAs: Object.entries(business.social)
      .filter(([k, v]) => v && k !== 'whatsapp')
      .map(([, v]) => v),
  };

  return (
    <script
      type="application/ld+json"
      // JSON serializado por nosotros; se escapa "<" para evitar cierre de etiqueta.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
