"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  checkPassword,
  endAdminSession,
  requireAdmin,
  startAdminSession,
} from "@/lib/auth";
import { VOTE_PATH } from "@/lib/constants";
import { getLiveShow } from "@/lib/data";
import {
  demoCreateShow,
  demoResetVotes,
  demoSetStatus,
  demoSetVisibility,
  demoSetWinner,
  isDemo,
} from "@/lib/demo-store";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { ResultsVisibility } from "@/lib/types";

export interface ActionResult {
  error?: string;
}

function fail(error: string): ActionResult {
  return { error };
}

// ---------------------------------------------------------------------- auth

export async function loginAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  if (!password) return fail("Escribí la contraseña.");

  try {
    if (!checkPassword(password)) return fail("Contraseña incorrecta.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Error de configuración.");
  }

  await startAdminSession();
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await endAdminSession();
  redirect("/admin");
}

// ------------------------------------------------------------- ciclo de vida

/**
 * Crea la funcion del dia. El indice parcial `shows_single_live` garantiza que
 * no puedan convivir dos: si quedo una abierta de la funcion anterior, el
 * insert falla y avisamos en vez de dejar dos funciones compitiendo.
 */
export async function createShowAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const raw = String(formData.get("name") ?? "").trim();
  const name = raw || defaultShowName();

  if (isDemo()) return finish(demoCreateShow(name));

  const { error } = await supabaseAdmin().from("shows").insert({ name });

  if (error) {
    return fail(
      error.code === "23505"
        ? "Ya hay una función activa. Finalizala antes de crear la próxima."
        : `No se pudo crear la función: ${error.message}`,
    );
  }

  revalidatePath("/admin");
  revalidatePath(VOTE_PATH);
  return {};
}

export async function openVotingAction(): Promise<ActionResult> {
  await requireAdmin();

  if (isDemo()) return finish(demoSetStatus("open"));

  const show = await getLiveShow();
  if (!show) return fail("No hay ninguna función activa.");
  if (show.status === "open") return {};
  if (show.status === "closed") {
    return fail("Esta votación ya cerró. Reabrila con «Reabrir votación».");
  }

  return updateShow(show.id, { status: "open", opened_at: new Date().toISOString() });
}

export async function closeVotingAction(): Promise<ActionResult> {
  await requireAdmin();

  if (isDemo()) return finish(demoSetStatus("closed"));

  const show = await getLiveShow();
  if (!show) return fail("No hay ninguna función activa.");
  if (show.status !== "open") return fail("La votación no está abierta.");

  return updateShow(show.id, {
    status: "closed",
    closed_at: new Date().toISOString(),
  });
}

/** Escotilla de emergencia: se cerro antes de tiempo y falta gente por votar. */
export async function reopenVotingAction(): Promise<ActionResult> {
  await requireAdmin();

  if (isDemo()) return finish(demoSetStatus("open"));

  const show = await getLiveShow();
  if (!show) return fail("No hay ninguna función activa.");
  if (show.status !== "closed") return fail("La votación no está cerrada.");

  return updateShow(show.id, { status: "open", closed_at: null });
}

export async function finishShowAction(): Promise<ActionResult> {
  await requireAdmin();

  if (isDemo()) return finish(demoSetStatus("finished"));

  const show = await getLiveShow();
  if (!show) return fail("No hay ninguna función activa.");

  return updateShow(show.id, {
    status: "finished",
    finished_at: new Date().toISOString(),
  });
}

// ------------------------------------------------------------- configuracion

export async function setVisibilityAction(
  visibility: ResultsVisibility,
): Promise<ActionResult> {
  await requireAdmin();

  if (isDemo()) return finish(demoSetVisibility(visibility));

  const show = await getLiveShow();
  if (!show) return fail("No hay ninguna función activa.");

  return updateShow(show.id, { results_visibility: visibility });
}

/**
 * Fija el final ganador a mano. Es lo que resuelve un empate: la obra tiene que
 * seguir igual, y esa decision la toma una persona, no un desempate automatico.
 * Pasar null vuelve al conteo puro.
 */
export async function setWinnerAction(
  optionId: string | null,
): Promise<ActionResult> {
  await requireAdmin();

  if (isDemo()) return finish(demoSetWinner(optionId));

  const show = await getLiveShow();
  if (!show) return fail("No hay ninguna función activa.");

  return updateShow(show.id, { winner_option_id: optionId });
}

/** Borra los votos de la funcion actual. Para ensayos y pruebas de sala. */
export async function resetVotesAction(): Promise<ActionResult> {
  await requireAdmin();

  if (isDemo()) return finish(demoResetVotes());

  const show = await getLiveShow();
  if (!show) return fail("No hay ninguna función activa.");

  const db = supabaseAdmin();

  const { error: deleteError } = await db.from("votes").delete().eq("show_id", show.id);
  if (deleteError) {
    return fail(`No se pudieron borrar los votos: ${deleteError.message}`);
  }

  // El trigger de votes ya descuenta uno por uno, pero un delete masivo puede
  // dejar restos si algo fallo a mitad de camino. Forzamos el cero.
  const { error: resetError } = await db
    .from("tallies")
    .update({ count: 0 })
    .eq("show_id", show.id);
  if (resetError) {
    return fail(`No se pudieron reiniciar los conteos: ${resetError.message}`);
  }

  return updateShow(show.id, { winner_option_id: null });
}

// ------------------------------------------------------------------ internos

/** Revalida y devuelve el resultado de una mutacion del modo demo. */
function finish(result: ActionResult): ActionResult {
  if (result.error) return result;

  revalidatePath("/admin");
  revalidatePath(VOTE_PATH);
  return {};
}

async function updateShow(
  id: string,
  patch: Record<string, unknown>,
): Promise<ActionResult> {
  const { error } = await supabaseAdmin().from("shows").update(patch).eq("id", id);
  if (error) return fail(`No se pudo actualizar la función: ${error.message}`);

  revalidatePath("/admin");
  revalidatePath(VOTE_PATH);
  return {};
}

function defaultShowName(): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
}
