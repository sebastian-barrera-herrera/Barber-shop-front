'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

export interface ThreadMessage {
  id: string;
  sender: 'CUSTOMER' | 'STAFF' | 'SYSTEM';
  body: string;
  createdAt: string;
  readAt?: string | null;
}

/**
 * Conversación estilo libreta: mensajes propios a la derecha, los del otro a la izquierda,
 * separados por día. La usan el panel (me = STAFF) y la página de la cita (me = CUSTOMER).
 */
export function ChatThread({
  messages,
  me,
  timezone,
  onSend,
  sending,
  otherLabel,
  placeholder = 'Escribe un mensaje…',
  emptyText,
  className = '',
}: {
  messages: ThreadMessage[];
  me: 'CUSTOMER' | 'STAFF';
  timezone: string;
  onSend: (body: string) => Promise<unknown>;
  sending: boolean;
  otherLabel: string;
  placeholder?: string;
  emptyText: string;
  className?: string;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = messages[messages.length - 1]?.id;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [lastId]);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setError(null);
    try {
      await onSend(body);
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar');
    }
  };

  const day = (iso: string) =>
    new Intl.DateTimeFormat('es-CO', {
      timeZone: timezone,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(iso));
  const time = (iso: string) =>
    new Intl.DateTimeFormat('es-CO', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <div
        className="min-h-0 flex-1 overflow-y-auto px-1 py-3"
        aria-live="polite"
        aria-label="Mensajes"
      >
        {messages.length === 0 && (
          <p className="text-stone py-8 text-center text-sm">{emptyText}</p>
        )}
        {messages.map((m, i) => {
          const mine = m.sender === me;
          const newDay = i === 0 || day(messages[i - 1].createdAt) !== day(m.createdAt);
          return (
            <div key={m.id}>
              {newDay && (
                <p className="eyebrow my-4 text-center first-letter:uppercase">
                  {day(m.createdAt)}
                </p>
              )}
              <div className={`mb-2 flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    mine
                      ? 'bg-ink text-paper rounded-br-md'
                      : 'border-line bg-paper-2 rounded-bl-md border'
                  }`}
                >
                  <span className="sr-only">{mine ? 'Tú' : otherLabel}: </span>
                  <p className="text-[0.95rem] leading-relaxed break-words whitespace-pre-wrap">
                    {m.body}
                  </p>
                  <p
                    className={`mt-1 text-right text-[11px] ${mine ? 'text-paper/70' : 'text-stone'}`}
                  >
                    {time(m.createdAt)}
                    {mine && m.readAt ? ' · leído' : ''}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="border-line border-t pt-3">
        <label htmlFor="chat-input" className="sr-only">
          Mensaje
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id="chat-input"
            rows={1}
            value={text}
            maxLength={2000}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder={placeholder}
            className="border-line bg-paper hover:border-stone focus:border-ink max-h-32 min-h-11 flex-1 resize-none rounded-2xl border px-4 py-2.5 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="bg-brand text-on-brand h-11 shrink-0 rounded-full px-5 disabled:opacity-40"
          >
            {sending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-sm text-[#A5473F]">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
