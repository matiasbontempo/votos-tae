import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import {
  composePublicState,
  getDeviceVote,
  getLiveShow,
  getOptions,
  getPublicState,
} from "@/lib/data";
import { demoVote, isDemo } from "@/lib/demo-store";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UNIQUE_VIOLATION = "23505";

interface VoteBody {
  optionId?: unknown;
  deviceId?: unknown;
}

/** Hash de la IP: sirve para contar, no para identificar a nadie. */
function clientIpHash(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]!.trim()
    : request.headers.get("x-real-ip");

  if (!ip) return null;

  return createHash("sha256")
    .update(`${ip}${process.env.AUTH_SECRET ?? ""}`)
    .digest("hex");
}

/**
 * Tope opcional de votos por IP. Apagado por default a proposito: si el teatro
 * ofrece wifi, las 40 butacas salen por una unica IP y un limite bajo dejaria
 * gente afuera. Solo tiene sentido activarlo si el publico entra por datos.
 */
async function overIpLimit(showId: string, ipHash: string | null): Promise<boolean> {
  const limit = Number(process.env.VOTE_IP_LIMIT ?? 0);
  if (!limit || !ipHash) return false;

  const { count, error } = await supabaseAdmin()
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("show_id", showId)
    .eq("ip_hash", ipHash);

  if (error) return false; // ante la duda, dejar votar
  return (count ?? 0) >= limit;
}

export async function POST(request: Request) {
  let body: VoteBody;
  try {
    body = (await request.json()) as VoteBody;
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const optionId = typeof body.optionId === "string" ? body.optionId : null;
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.slice(0, 100) : null;

  if (!optionId || !deviceId) {
    return NextResponse.json(
      { error: "Faltan optionId o deviceId." },
      { status: 400 },
    );
  }

  // La funcion se resuelve en el servidor, no se confia en la que mande el
  // cliente: asi un celular con la pagina vieja abierta no puede votar en una
  // funcion que ya termino.
  //
  // Las opciones se traen en el mismo viaje aunque todavia no se usen: sirven
  // para validar el optionId sin una query aparte, y son la mitad del estado
  // que hay que devolver. Pedirlas despues costaba dos saltos mas.
  const [show, options] = await Promise.all([getLiveShow(), getOptions()]);

  if (!show) {
    return NextResponse.json(
      { error: "No hay ninguna función activa." },
      { status: 409 },
    );
  }

  if (show.status !== "open") {
    return NextResponse.json(
      {
        error:
          show.status === "idle"
            ? "La votación todavía no abrió."
            : "La votación ya cerró.",
        state: await composePublicState({
          show,
          options,
          myVote: await getDeviceVote(show.id, deviceId),
        }),
      },
      { status: 409 },
    );
  }

  // Validar contra las opciones que ya trajimos no cuesta una query, asi que va
  // antes de la rama demo: el ensayo se comporta igual que la funcion real.
  if (!options.some((o) => o.id === optionId)) {
    return NextResponse.json({ error: "Esa opción no existe." }, { status: 400 });
  }

  if (isDemo()) {
    const result = demoVote(deviceId, optionId);
    return NextResponse.json({
      ok: result.ok,
      alreadyVoted: "alreadyVoted" in result ? result.alreadyVoted : false,
      state: await getPublicState(deviceId),
    });
  }

  const ipHash = clientIpHash(request);
  if (await overIpLimit(show.id, ipHash)) {
    return NextResponse.json(
      { error: "Se alcanzó el límite de votos para esta conexión." },
      { status: 429 },
    );
  }

  const { error } = await supabaseAdmin().from("votes").insert({
    show_id: show.id,
    option_id: optionId,
    device_id: deviceId,
    ip_hash: ipHash,
  });

  if (error && error.code !== UNIQUE_VIOLATION) {
    return NextResponse.json(
      { error: `No se pudo registrar el voto: ${error.message}` },
      { status: 500 },
    );
  }

  // Si fue violacion de unicidad el dispositivo ya habia votado: no es un error
  // para el usuario, simplemente le devolvemos el estado con su voto original.
  // Ese es el unico caso que obliga a preguntarle a la base que voto; en el
  // camino normal ya lo sabemos, porque lo acabamos de insertar.
  const alreadyVoted = error?.code === UNIQUE_VIOLATION;
  const myVote = alreadyVoted
    ? await getDeviceVote(show.id, deviceId)
    : optionId;

  return NextResponse.json({
    ok: true,
    alreadyVoted,
    state: await composePublicState({ show, options, myVote }),
  });
}
