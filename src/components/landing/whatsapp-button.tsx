import { whatsappLink } from '@/lib/format';

/** Botón flotante discreto. El número viene de la configuración del negocio. */
export function WhatsAppButton({ phone, businessName }: { phone: string; businessName: string }) {
  return (
    <a
      href={whatsappLink(phone, `Hola ${businessName}, tengo una pregunta`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="border-line bg-paper text-ink fixed right-4 bottom-4 z-30 flex size-13 items-center justify-center rounded-full border shadow-[0_6px_24px_-8px_rgb(0_0_0/0.25)] transition-transform hover:-translate-y-0.5 sm:right-6 sm:bottom-6"
    >
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden fill="currentColor">
        <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5.1 5.2-1.4A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3a8.2 8.2 0 1 1 7 3.9Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.5 1 2.7.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
      </svg>
    </a>
  );
}
