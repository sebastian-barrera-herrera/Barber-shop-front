'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChatThread } from '@/components/chat/chat-thread';
import { useSite } from '@/lib/site';
import type { PublicMessage } from '@/lib/types';

/** Chat del cliente con el negocio, desde el enlace de su cita. Se actualiza cada 15 s. */
export function AppointmentChat({
  token,
  businessName,
  timezone,
}: {
  token: string;
  businessName: string;
  timezone: string;
}) {
  const { api } = useSite();
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.messages(token);
      setMessages(r.messages);
      if (r.messages.length) setOpen(true);
    } catch {
      /* sin conexión: se reintenta en la siguiente vuelta */
    }
  }, [token]);

  useEffect(() => {
    void load();
    const t = setInterval(() => {
      if (!document.hidden) void load();
    }, 15_000);
    return () => clearInterval(t);
  }, [load]);

  const send = async (body: string) => {
    setSending(true);
    try {
      const m = await api.sendMessage(token, body);
      setMessages((prev) => [...prev, m]);
    } finally {
      setSending(false);
    }
  };

  return (
    <section aria-labelledby="chat-title" className="border-line rounded-[22px] border p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="chat-title" className="font-display text-2xl">
          ¿Necesitas algo?
        </h2>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-sm underline underline-offset-2"
          >
            Escribir a {businessName}
          </button>
        )}
      </div>
      <p className="text-stone mt-1 text-sm">
        Cambios, dudas o indicaciones: te respondemos por aquí.
      </p>
      {open && (
        <ChatThread
          className="mt-3 max-h-[420px]"
          messages={messages}
          me="CUSTOMER"
          otherLabel={businessName}
          timezone={timezone}
          sending={sending}
          onSend={send}
          emptyText="Escríbenos y te responderemos lo antes posible."
          placeholder="Hola, ¿puedo cambiar mi cita para las 5?"
        />
      )}
    </section>
  );
}
