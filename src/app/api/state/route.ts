import { NextResponse } from "next/server";

import { getPublicState } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * Estado actual para un dispositivo.
 *
 * La pantalla publica se actualiza por Realtime; esto es el respaldo: se llama
 * al volver del background, cuando cambia el estado de la funcion, y como
 * polling lento si el websocket no engancha (wifi de teatro).
 */
export async function GET(request: Request) {
  const deviceId = new URL(request.url).searchParams.get("deviceId");
  const state = await getPublicState(deviceId);

  return NextResponse.json(state, {
    headers: { "cache-control": "no-store" },
  });
}
