'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { publicApi } from '@/lib/api';
import { formatMoney } from '@/lib/format';

/** Lleva al cliente a la pasarela (Wompi). El precio lo pone el servidor, no la página. */
export function PayButton({
  token,
  amountCents,
  currency,
  required,
}: {
  token: string;
  amountCents: number;
  currency: string;
  required: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      const { url } = await publicApi.startPayment(token);
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos iniciar el pago');
      setBusy(false);
    }
  };

  return (
    <section
      aria-labelledby="pay-title"
      className={`rounded-[22px] border p-5 ${required ? 'border-ink' : 'border-line'}`}
    >
      <h2 id="pay-title" className="font-display text-2xl">
        {required ? 'Paga para confirmar tu cita' : 'Paga ahora y llega sin filas'}
      </h2>
      <p className="text-stone mt-1 text-sm">
        {required
          ? 'Tu cita queda confirmada apenas se apruebe el pago.'
          : 'También puedes pagar en el local.'}{' '}
        Pago seguro con Wompi: tarjeta, PSE o Nequi.
      </p>
      <Button
        size="lg"
        className="mt-4 w-full sm:w-auto"
        onClick={() => void pay()}
        disabled={busy}
      >
        {busy ? 'Abriendo el pago…' : `Pagar ${formatMoney(amountCents, currency)}`}
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#A5473F]">
          {error}
        </p>
      )}
    </section>
  );
}
