/**
 * Origen publico del sitio, para metadata, robots, sitemap y JSON-LD.
 *
 * A diferencia de `siteUrl()` en la hoja de QR, esta version no mira los
 * headers del request: se resuelve con variables de entorno, en build, para
 * que la landing quede estatica. En Vercel alcanza con la URL de produccion
 * del proyecto; `NEXT_PUBLIC_SITE_URL` la pisa cuando el dominio propio esta
 * apuntado (https://agravadoporelvinculo.com.ar).
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured?.startsWith("http")) return configured.replace(/\/+$/, "");

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`;

  return "http://localhost:3000";
}
