'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';
import { EmptyState, NoAccess, PageHeader, PageShell } from '@/components/admin/page-header';
import { ChatThread } from '@/components/chat/chat-thread';
import { prettyPhone, whatsappLink } from '@/lib/format';
import { useAuth } from '@/lib/admin/auth';
import {
  useConversation,
  useConversations,
  useMarkConversationRead,
  useSendMessage,
} from '@/lib/admin/hooks';
import { useBusiness } from '@/lib/admin/queries';

function MensajesInner() {
  const params = useSearchParams();
  const router = useRouter();
  const business = useBusiness();
  const tz = business.data?.timezone ?? 'America/Bogota';
  const list = useConversations();
  const activeId = params.get('c');
  const thread = useConversation(activeId);
  const send = useSendMessage();
  const markRead = useMarkConversationRead();
  const active = list.data?.find((c) => c.id === activeId);

  // Al abrir una conversación con mensajes nuevos, marcarla como leída (una vez por mensaje nuevo).
  const marked = useRef<string | null>(null);
  const { mutate: markAsRead } = markRead;
  useEffect(() => {
    if (!active || active.unreadForBusiness === 0) return;
    const key = `${active.id}:${active.lastMessageAt}`;
    if (marked.current === key) return;
    marked.current = key;
    markAsRead(active.id);
  }, [active, markAsRead]);

  const open = (id: string | null) =>
    router.replace(id ? `/admin/mensajes?c=${id}` : '/admin/mensajes', { scroll: false });
  const when = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const sameDay =
      new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d) ===
      new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
    return new Intl.DateTimeFormat(
      'es-CO',
      sameDay
        ? { timeZone: tz, hour: 'numeric', minute: '2-digit' }
        : { timeZone: tz, day: 'numeric', month: 'short' },
    ).format(d);
  };

  return (
    <PageShell>
      <PageHeader
        title="Mensajes"
        description="Conversaciones con tus clientes. Ellos escriben desde el enlace de su cita."
      />

      {list.data && !list.data.length ? (
        <EmptyState
          title="Aún no hay conversaciones"
          body="Cuando un cliente te escriba desde su cita, aparecerá aquí. También puedes escribirle tú desde su ficha en Clientes."
          action={
            <Link href="/admin/clientes" className="underline underline-offset-2">
              Ir a Clientes
            </Link>
          }
        />
      ) : (
        <div className="border-line grid h-[calc(100dvh-220px)] min-h-[480px] overflow-hidden rounded-2xl border md:grid-cols-[320px_1fr]">
          <ul
            className={`border-line overflow-y-auto md:border-r ${activeId ? 'hidden md:block' : ''}`}
            aria-label="Conversaciones"
          >
            {(list.data ?? []).map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => open(c.id)}
                  aria-current={c.id === activeId ? 'true' : undefined}
                  className="border-line hover:bg-paper-2 aria-[current=true]:bg-paper-2 flex w-full flex-col gap-0.5 border-b px-4 py-3 text-left"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate ${c.unreadForBusiness ? 'font-medium' : ''}`}>
                      {c.customer.name}
                    </span>
                    <span className="text-stone shrink-0 text-xs">{when(c.lastMessageAt)}</span>
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-stone truncate text-sm">
                      {c.lastMessage
                        ? `${c.lastMessage.sender === 'STAFF' ? 'Tú: ' : ''}${c.lastMessage.body}`
                        : 'Sin mensajes'}
                    </span>
                    {c.unreadForBusiness > 0 && (
                      <span
                        className="tabular bg-accent shrink-0 rounded-full px-2 text-xs leading-5 text-white"
                        aria-label={`${c.unreadForBusiness} sin leer`}
                      >
                        {c.unreadForBusiness}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <section
            className={`flex min-h-0 flex-col p-4 ${activeId ? '' : 'hidden md:flex'}`}
            aria-label="Conversación"
          >
            {!activeId ? (
              <p className="text-stone m-auto">Elige una conversación.</p>
            ) : (
              <>
                <header className="border-line flex items-center justify-between gap-3 border-b pb-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => open(null)}
                      className="md:hidden"
                      aria-label="Volver a la lista"
                    >
                      ←
                    </button>
                    <div>
                      <p className="font-display text-xl">
                        {thread.data?.conversation.customer.name ?? active?.customer.name}
                      </p>
                      {thread.data && (
                        <p className="text-stone text-xs">
                          {prettyPhone(thread.data.conversation.customer.phone)}
                        </p>
                      )}
                    </div>
                  </div>
                  {thread.data && (
                    <div className="flex gap-3 text-sm">
                      <Link
                        href={`/admin/clientes?id=${thread.data.conversation.customer.id}`}
                        className="underline underline-offset-2"
                      >
                        Ficha
                      </Link>
                      <a
                        href={whatsappLink(thread.data.conversation.customer.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2"
                      >
                        WhatsApp
                      </a>
                    </div>
                  )}
                </header>
                <ChatThread
                  className="flex-1"
                  messages={thread.data?.messages ?? []}
                  me="STAFF"
                  otherLabel={thread.data?.conversation.customer.name ?? 'Cliente'}
                  timezone={tz}
                  sending={send.isPending}
                  onSend={(body) => send.mutateAsync({ conversationId: activeId, body })}
                  emptyText="Escribe el primer mensaje."
                  placeholder="Responder… (Enter para enviar)"
                />
              </>
            )}
          </section>
        </div>
      )}
    </PageShell>
  );
}

export default function MensajesPage() {
  const { canManage } = useAuth();
  if (!canManage) return <NoAccess who="el dueño o el administrador" />;
  return (
    <Suspense>
      <MensajesInner />
    </Suspense>
  );
}
