import "server-only";

import { applyCasting } from "@/lib/cast";
import { getLiveShow, getOptions, getTallies, mapShow } from "@/lib/data";
import { demoHistory, isDemo } from "@/lib/demo-store";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Show, Tally, VoteOption } from "@/lib/types";

export interface PastShow {
  id: string;
  name: string;
  total: number;
  winnerName: string | null;
  finishedAt: string | null;
}

export interface AdminState {
  show: Show | null;
  options: VoteOption[];
  tallies: Tally[];
  total: number;
  history: PastShow[];
}

export async function getAdminState(): Promise<AdminState> {
  const [options, show, history] = await Promise.all([
    getOptions(),
    getLiveShow(),
    getHistory(),
  ]);

  const tallies = show ? await getTallies(show.id) : [];

  return {
    show,
    options: applyCasting(options, show?.casting ?? {}),
    tallies,
    total: tallies.reduce((sum, t) => sum + t.count, 0),
    history,
  };
}

/** Ultimas funciones finalizadas, con su ganador y su total. */
async function getHistory(limit = 8): Promise<PastShow[]> {
  if (isDemo()) return demoHistory();

  const db = supabaseAdmin();

  const { data, error } = await db
    .from("shows")
    .select("*")
    .eq("status", "finished")
    .order("finished_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !data?.length) return [];

  const shows = data.map((row) => mapShow(row));
  const options = await getOptions();

  return Promise.all(
    shows.map(async (show) => {
      const tallies = await getTallies(show.id);
      const total = tallies.reduce((sum, t) => sum + t.count, 0);
      const winnerId = show.winnerOptionId ?? topOptionId(tallies);

      return {
        id: show.id,
        name: show.name,
        total,
        winnerName: options.find((o) => o.id === winnerId)?.name ?? null,
        finishedAt: show.closedAt,
      };
    }),
  );
}

/** Id de la opcion mas votada; null si no hay votos o hay empate arriba. */
export function topOptionId(tallies: Tally[]): string | null {
  const sorted = [...tallies].sort((a, b) => b.count - a.count);
  const top = sorted[0];

  if (!top || top.count === 0) return null;
  if (sorted[1] && sorted[1].count === top.count) return null;

  return top.optionId;
}
