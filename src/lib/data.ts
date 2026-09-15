import "server-only";

import {
  demoDeviceVote,
  demoLiveShow,
  demoOptions,
  demoTallies,
  isDemo,
} from "@/lib/demo-store";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  canSeeResults,
  type PublicState,
  type Show,
  type Tally,
  type VoteOption,
} from "@/lib/types";

interface OptionRow {
  id: string;
  name: string;
  subtitle: string | null;
  blurb: string | null;
  color: string;
  image_url: string | null;
  sort_order: number;
}

interface ShowRow {
  id: string;
  name: string;
  status: Show["status"];
  results_visibility: Show["resultsVisibility"];
  winner_option_id: string | null;
  created_at: string;
  opened_at: string | null;
  closed_at: string | null;
}

interface TallyRow {
  option_id: string;
  count: number;
}

export function mapOption(row: OptionRow): VoteOption {
  return {
    id: row.id,
    name: row.name,
    subtitle: row.subtitle,
    blurb: row.blurb,
    color: row.color,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
  };
}

export function mapShow(row: ShowRow): Show {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    resultsVisibility: row.results_visibility,
    winnerOptionId: row.winner_option_id,
    createdAt: row.created_at,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
  };
}

export async function getOptions(): Promise<VoteOption[]> {
  if (isDemo()) return demoOptions();

  const { data, error } = await supabaseAdmin()
    .from("options")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`No se pudieron leer las opciones: ${error.message}`);
  return (data as OptionRow[]).map(mapOption);
}

/** La unica funcion no finalizada, si existe. */
export async function getLiveShow(): Promise<Show | null> {
  if (isDemo()) return demoLiveShow();

  const { data, error } = await supabaseAdmin()
    .from("shows")
    .select("*")
    .neq("status", "finished")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer la función actual: ${error.message}`);
  return data ? mapShow(data as ShowRow) : null;
}

export async function getTallies(showId: string): Promise<Tally[]> {
  if (isDemo()) return demoTallies(showId);

  const { data, error } = await supabaseAdmin()
    .from("tallies")
    .select("option_id, count")
    .eq("show_id", showId);

  if (error) throw new Error(`No se pudieron leer los votos: ${error.message}`);
  return (data as TallyRow[]).map((r) => ({ optionId: r.option_id, count: r.count }));
}

export async function getDeviceVote(
  showId: string,
  deviceId: string | null,
): Promise<string | null> {
  if (!deviceId) return null;
  if (isDemo()) return demoDeviceVote(showId, deviceId);

  const { data, error } = await supabaseAdmin()
    .from("votes")
    .select("option_id")
    .eq("show_id", showId)
    .eq("device_id", deviceId)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer el voto: ${error.message}`);
  return data ? (data as { option_id: string }).option_id : null;
}

/**
 * Arma el estado publico con lo que el llamador ya tiene en la mano, y pide a
 * la base solo lo que falta (los conteos, y solo si se pueden mostrar).
 *
 * Existe por /api/vote: esa ruta ya trajo la funcion y las opciones para
 * validar, y sabe que voto el dispositivo porque lo acaba de insertar. Cuando
 * terminaba llamando a getPublicState, volvia a pedir las tres cosas: cada voto
 * pagaba seis viajes a Supabase en serie —dos de ellos repetidos— con el dedo
 * del espectador esperando los seis.
 *
 * Los conteos se omiten (null) cuando la configuracion de la funcion todavia no
 * permite mostrarlos — el filtro vive en el servidor a proposito, para que no se
 * puedan espiar desde devtools.
 */
export async function composePublicState({
  show,
  options,
  myVote,
}: {
  show: Show | null;
  options: VoteOption[];
  myVote: string | null;
}): Promise<PublicState> {
  if (!show) {
    return { show: null, options, tallies: null, total: null, myVote: null };
  }

  if (!canSeeResults(show, myVote !== null)) {
    return { show, options, tallies: null, total: null, myVote };
  }

  const tallies = await getTallies(show.id);
  return {
    show,
    options,
    tallies,
    total: tallies.reduce((sum, t) => sum + t.count, 0),
    myVote,
  };
}

/** Estado que consume la pantalla publica, partiendo de cero. */
export async function getPublicState(deviceId: string | null): Promise<PublicState> {
  const [options, show] = await Promise.all([getOptions(), getLiveShow()]);

  if (!show) {
    return { show: null, options, tallies: null, total: null, myVote: null };
  }

  const myVote = await getDeviceVote(show.id, deviceId);
  return composePublicState({ show, options, myVote });
}
