import { cookies } from "next/headers";

import { VoteApp } from "@/components/vote/VoteApp";
import { DEVICE_COOKIE } from "@/lib/constants";
import { getPublicState } from "@/lib/data";
import { VOTE_UIS, type VoteUI } from "@/lib/types";

export const dynamic = "force-dynamic";

function resolveUI(raw: string | undefined): VoteUI {
  if (raw && (VOTE_UIS as string[]).includes(raw)) return raw as VoteUI;

  const fallback = process.env.NEXT_PUBLIC_DEFAULT_VOTE_UI;
  if (fallback && (VOTE_UIS as string[]).includes(fallback)) {
    return fallback as VoteUI;
  }
  return "swipe";
}

/**
 * Pantalla del publico. Es la raiz del sitio a proposito: el QR de la butaca
 * codifica el dominio pelado y nada mas, que es lo que mejor escanea a oscuras.
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
