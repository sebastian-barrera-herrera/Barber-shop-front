import { Arrow } from '@/components/ui/button';
import { formatHhmm, prettyPhone, WEEKDAYS, whatsappLink } from '@/lib/format';
import { currentWeekday, weekOrder } from '@/lib/hours';
import type { BusinessProfile } from '@/lib/types';

/** Horario, dirección y formas de contacto. */
export function Visit({ business }: { business: BusinessProfile }) {
  const today = currentWeekday(business.timezone);
  const whatsapp = business.whatsapp ?? business.social.whatsapp;
  const mapsUrl =
    business.latitude != null && business.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`
      : business.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.address}, ${business.city ?? ''}`)}`
        : null;

  return (
    <div className="grid gap-12 md:grid-cols-2">
      <div>
        <h3 className="eyebrow mb-4">Horario</h3>
        <table className="w-full text-[1.02rem]">
          <tbody>
            {weekOrder(business.openingHours).map((d) => (
              <tr
                key={d.weekday}
                className={`border-line border-b ${d.weekday === today ? 'text-ink font-medium' : 'text-stone'}`}
                aria-current={d.weekday === today ? 'date' : undefined}
              >
                <th scope="row" className="py-3 text-left font-[inherit]">
                  {WEEKDAYS[d.weekday]}
                  {d.weekday === today && <span className="text-accent ml-2 text-xs">hoy</span>}
                </th>
                <td className="tabular py-3 text-right">
                  {d.closed ? 'Cerrado' : `${formatHhmm(d.open)} – ${formatHhmm(d.close)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-8">
        {business.address && (
          <div>
            <h3 className="eyebrow mb-3">Dirección</h3>
            <p className="font-display text-3xl leading-tight">{business.address}</p>
            {business.city && <p className="text-stone mt-1">{business.city}</p>}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
              >
                Cómo llegar <Arrow />
              </a>
            )}
          </div>
        )}
        <div>
          <h3 className="eyebrow mb-3">Escríbenos</h3>
          <ul className="divide-line border-line divide-y border-y">
            {whatsapp && (
              <ContactRow
                href={whatsappLink(whatsapp, `Hola ${business.name}`)}
                label="WhatsApp"
                value={prettyPhone(whatsapp)}
                external
              />
            )}
            {business.phone && (
              <ContactRow
                href={`tel:${business.phone}`}
                label="Llamar"
                value={prettyPhone(business.phone)}
              />
            )}
            {business.social.instagram && (
              <ContactRow
                href={business.social.instagram}
                label="Instagram"
                value={business.social.instagram.replace(
                  /^https?:\/\/(www\.)?instagram\.com\//,
                  '@',
                )}
                external
              />
            )}
            {business.email && (
              <ContactRow href={`mailto:${business.email}`} label="Correo" value={business.email} />
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ContactRow({
  href,
  label,
  value,
  external,
}: {
  href: string;
  label: string;
  value: string;
  external?: boolean;
}) {
  return (
    <li>
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="group flex items-center justify-between gap-4 py-3.5"
      >
        <span className="text-stone">{label}</span>
        <span className="flex items-center gap-2">
          {value}
          <Arrow className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </a>
    </li>
  );
}
