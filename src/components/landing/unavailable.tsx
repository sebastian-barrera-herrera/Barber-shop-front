/** Si la API no responde, un aviso claro en vez de una página rota. */
export function Unavailable() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6">
      <p className="eyebrow">Un momento</p>
      <h1 className="font-display mt-3 text-4xl font-light">Estamos actualizando la página</h1>
      <p className="text-stone mt-4">Vuelve a intentarlo en unos minutos.</p>
    </main>
  );
}
