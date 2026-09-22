/**
 * Negocios de muestra de la plataforma. Quien los visita está viendo una demostración:
 * no puede reservar, solo crear su cuenta o volver.
 */
const DEMO_SLUGS = (process.env.NEXT_PUBLIC_DEMO_SLUGS || 'studio-demo,barberia-demo')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function isDemo(slug: string): boolean {
  return DEMO_SLUGS.includes(slug);
}
