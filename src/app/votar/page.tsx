import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";

import { VoteApp } from "@/components/vote/VoteApp";
import { DEVICE_COOKIE } from "@/lib/constants";
import { getPublicState } from "@/lib/data";
import { VOTE_UIS, type VoteUI } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Sin pinch-zoom: en plena escena, un zoom accidental sobre los botones de voto
 * deja al espectador peleando con la pantalla en el peor momento.
 *
 * Vive aca y no en el layout raiz a proposito. Bloquear el zoom en toda la app
 * se llevaba puesta a la landing, donde alguien que no ve de cerca tiene que
 * poder agrandar el texto.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/** La pantalla de voto no es contenido para buscadores; la landing si. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function resolveUI(raw: string | undefined): VoteUI {
  if (raw && (VOTE_UIS as string[]).includes(raw)) return raw as VoteUI;

  const fallback = process.env.NEXT_PUBLIC_DEFAULT_VOTE_UI;
  if (fallback && (VOTE_UIS as string[]).includes(fallback)) {
    return fallback as VoteUI;
  }
  // Scroll vertical: el gesto de feed que todo el mundo ya tiene incorporado, y
  // la variante que aguanta los siete sospechosos sin achicar a nadie.
  return "stack";
}

/**
 * Pantalla del publico, en `/votar` (ver VOTE_PATH). La raiz quedo para la
 * landing de la obra, asi que el QR de la butaca codifica dominio + esta ruta.
 *
 * `?ui=grid|swipe|stack` fuerza una variante para probar en ensayo sin tocar
 * la configuracion.
 */
export default async function VotePage({
  searchParams,
}: {
  searchParams: Promise<{ ui?: string }>;
}) {
  const [{ ui }, cookieStore] = await Promise.all([searchParams, cookies()]);

  const deviceId = cookieStore.get(DEVICE_COOKIE)?.value ?? null;
  const state = await getPublicState(deviceId);

  return <VoteApp initialState={state} ui={resolveUI(ui)} />;
}
