import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/auth";
import { getAdminState } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

/**
 * Estado completo para el panel. A diferencia de /api/state nunca filtra los
 * conteos: el admin ve los numeros aunque el publico los tenga ocultos.
 */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  return NextResponse.json(await getAdminState(), {
    headers: { "cache-control": "no-store" },
  });
}
