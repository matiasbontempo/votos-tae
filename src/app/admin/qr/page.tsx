import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import QRCode from "qrcode";

import { PrintButton } from "@/components/admin/PrintButton";
import { isAdmin } from "@/lib/auth";
import { SHOW_TITLE } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * Dominio que se codifica en el QR, del mas explicito al mas adivinado.
 *
 * El host del request va ANTES de la variable de Vercel a proposito: si el
 * proyecto tiene dominio propio, `VERCEL_PROJECT_PRODUCTION_URL` igual devuelve
 * el `.vercel.app`, y el papel de la butaca terminaria con la URL fea (o con
 * una que dejo de funcionar si algun dia se suelta ese subdominio).
 */
async function siteUrl(override?: string): Promise<string> {
  if (override?.startsWith("http")) return override;

  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured?.startsWith("http")) return configured.replace(/\/+$/, "");

  const host = (await headers()).get("host");
  if (host) {
    const proto = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
    return `${proto}://${host}`;
  }

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`;

  return "http://localhost:3000";
}

export default async function QrPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; copias?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin");

  const { url: override, copias } = await searchParams;
  const url = await siteUrl(override);

  // Correccion de errores alta: el papel pegado en una butaca se dobla, se raya
  // y se lee a media luz.
  const dataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 640,
    color: { dark: "#000000", light: "#ffffff" },
  });

  const copies = Math.min(Math.max(Number(copias) || 6, 1), 12);

  return (
    <>
      <main className="stage-bg min-h-screen-safe px-4 py-8 print:hidden">
        <div className="mx-auto w-full max-w-lg text-center">
          <p className="text-brass text-[11px] font-semibold tracking-[0.25em] uppercase">
            Backstage
          </p>
          <h1 className="font-display mt-1 mb-6 text-2xl">QR para las butacas</h1>

          <div className="mx-auto w-fit rounded-2xl bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL generada en el server */}
            <img src={dataUrl} alt={`QR a ${url}`} className="h-56 w-56" />
          </div>

          <p className="text-muted mt-4 font-mono text-xs break-all">{url}</p>

          <p className="text-muted mx-auto mt-6 max-w-sm text-sm leading-relaxed">
            Imprimí la hoja y pegá un código por butaca. Apunta a la raíz del
            sitio, así que el mismo QR sirve para todas las funciones: lo que
            ve el público depende del estado que fijes en el panel.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <PrintButton />
            <Link
              href="/admin"
              className="text-muted hover:text-parchment rounded-xl border border-white/12 px-4 py-2.5 text-sm"
            >
              Volver al panel
            </Link>
          </div>
        </div>
      </main>

      {/* Hoja de impresion: solo existe al imprimir. */}
      <div className="hidden print:block">
        <div className="grid grid-cols-2 gap-6 p-6">
          {Array.from({ length: copies }, (_, i) => (
            <div
              key={i}
              className="flex break-inside-avoid flex-col items-center rounded border border-dashed border-neutral-400 p-4 text-center text-black"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL generada en el server */}
              <img src={dataUrl} alt="" className="h-40 w-40" />
              <p className="mt-2 text-[10px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
                {SHOW_TITLE}
              </p>
              <p className="mt-1 text-sm font-semibold">Escaneá para votar</p>
              <p className="mt-0.5 text-[10px] text-neutral-600">
                Al final de la obra vas a decidir quién fue.
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
