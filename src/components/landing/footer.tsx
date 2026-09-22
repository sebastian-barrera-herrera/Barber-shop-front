import Link from 'next/link';
import { prettyPhone, whatsappLink } from '@/lib/format';
import type { BusinessProfile } from '@/lib/types';

const SOCIAL_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  website: 'Sitio web',
};

export function Footer({ business }: { business: BusinessProfile }) {
  const socials = Object.entries(business.social).filter(([k, v]) => v && k in SOCIAL_LABEL);
  const whatsapp = business.whatsapp ?? business.social.whatsapp;

  return (
    <footer className="border-line mt-24 border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <p className="font-display text-3xl">{business.name}</p>
          {business.address && (
            <p className="text-stone mt-3">
              {business.address}
              {business.city ? `, ${business.city}` : ''}
            </p>
          )}
        </div>

        <nav aria-label="Pie de página">
          <p className="eyebrow mb-3">Visita</p>
          <ul className="space-y-2">
            <li>
              <Link href="/servicios" className="hover:underline">
                Servicios y precios
              </Link>
            </li>
            <li>
              <Link href="/profesionales" className="hover:underline">
                Equipo
              </Link>
            </li>
            <li>
              <Link href="/reservar" className="hover:underline">
                Reservar cita
              </Link>
            </li>
            <li>
              <Link href="/contacto" className="hover:underline">
                Horario y ubicación
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className="eyebrow mb-3">Contacto</p>
          <ul className="space-y-2">
            {whatsapp && (
              <li>
                <a
                  href={whatsappLink(whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  WhatsApp {prettyPhone(whatsapp)}
                </a>
              </li>
            )}
            {business.email && (
              <li>
                <a href={`mailto:${business.email}`} className="hover:underline">
                  {business.email}
                </a>
              </li>
            )}
            {socials.map(([key, url]) => (
              <li key={key}>
                <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {SOCIAL_LABEL[key]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-line text-stone mx-auto max-w-6xl border-t px-4 py-5 text-sm sm:px-6">
        © {new Date().getFullYear()} {business.name}
      </div>
    </footer>
  );
}
