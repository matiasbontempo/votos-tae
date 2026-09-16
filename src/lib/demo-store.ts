import "server-only";

import type { Casting } from "@/lib/cast";
import type {
  ResultsVisibility,
  Show,
  ShowStatus,
  Tally,
  VoteOption,
} from "@/lib/types";

/**
 * Modo demo: la app entera funcionando en memoria, sin Supabase.
 *
 * Sirve para dos cosas: probar y comparar las tres variantes de la pantalla de
 * votacion antes de configurar nada, y ensayar el circuito del panel. Se activa
 * con `npm run demo`.
 *
 * Los datos viven en el proceso: se reinician cuando reiniciás el server, y no
 * funciona en Vercel (cada request puede tocar otra instancia). Para funciones
 * de verdad hay que usar Supabase.
 */
export function isDemo(): boolean {
  return process.env.DEMO_MODE === "1";
}

export const DEMO_OPTIONS: VoteOption[] = [
  {
    id: "noah",
    name: "Noah Davies",
    subtitle: "Detective",
    blurb:
      "Llegó a la mansión antes de que nadie lo llamara, y conoce cada pasillo demasiado bien. ¿Quién investiga al que investiga?",
    color: "#3b82f6",
    imageUrl: null,
    castId: null,
    sortOrder: 1,
  },
  {
    id: "maid",
    name: "Lady Maid",
    subtitle: "Ama de llaves",
    blurb:
      "Tiene la llave de todas las puertas y escuchó todas las conversaciones. Nadie mira a quien sirve el té.",
    color: "#10b981",
    imageUrl: null,
    castId: null,
    sortOrder: 2,
  },
  {
    id: "liam",
    name: "Liam Jones",
    subtitle: "Mano derecha de Emily",
    blurb:
      "Manejaba cada negocio, cada deuda y cada secreto de Emily. Ser imprescindible también es un motivo.",
    color: "#f59e0b",
    imageUrl: null,
    castId: null,
    sortOrder: 3,
  },
  {
    id: "james",
    name: "James Smith",
    subtitle: "2do esposo de Emily",
    blurb:
      "Entró a la familia por la puerta grande y todavía lo miran como a un extraño. Tenía todo por ganar y nada que perder.",
    color: "#8b5cf6",
    imageUrl: null,
    castId: null,
    sortOrder: 4,
  },
  {
    id: "mary",
    name: "Mary Caissings",
    subtitle: "Esposa de John",
    blurb:
      "Se casó con el apellido y aprendió a soportar lo que venía con él. Esa noche dejó de sonreír.",
    color: "#e11d48",
    imageUrl: null,
    castId: null,
    sortOrder: 5,
  },
  {
    id: "cinthia",
    name: "Cinthia Murdoch",
    subtitle: "Protegida de Emily",
    blurb:
      "Emily la levantó de la nada y la sentó en una mesa donde nadie la quería. La gratitud también tiene fecha de vencimiento.",
    color: "#22d3ee",
    imageUrl: null,
    castId: null,
    sortOrder: 6,
  },
  {
    id: "lawrence",
    name: "Lawrence Caissings",
    subtitle: "Hijo menor de Emily",
    blurb:
      "Siempre segundo, siempre después. Esperó su turno toda la vida y esa noche se le acabó la paciencia.",
    color: "#f472b6",
    imageUrl: null,
    castId: null,
    sortOrder: 7,
  },
];

interface DemoShow extends Show {
  votes: Map<string, string>; // deviceId -> optionId
}

interface DemoState {
  live: DemoShow | null;
  past: DemoShow[];
}

// Sobrevive al hot reload de `next dev`, que recarga los modulos.
const globalRef = globalThis as unknown as { __taeDemo?: DemoState };

function store(): DemoState {
  globalRef.__taeDemo ??= { live: seedShow(), past: [] };
  return globalRef.__taeDemo;
}

function seedShow(): DemoShow {
  return {
    id: "demo-show",
    name: "Función de prueba",
    status: "open",
    resultsVisibility: "hidden",
    winnerOptionId: null,
    casting: {},
    createdAt: new Date().toISOString(),
    openedAt: new Date().toISOString(),
    closedAt: null,
    // Unos votos de arranque para que las barras no esten vacias al mirar.
    votes: new Map([
      ["seed-1", "noah"],
      ["seed-2", "mary"],
      ["seed-3", "noah"],
      ["seed-4", "liam"],
      ["seed-5", "mary"],
      ["seed-6", "mary"],
      ["seed-7", "cinthia"],
    ]),
  };
}

export function demoOptions(): VoteOption[] {
  return DEMO_OPTIONS;
}

export function demoLiveShow(): Show | null {
  const { live } = store();
  if (!live) return null;

  const { votes: _votes, ...show } = live;
  return show;
}

export function demoTallies(showId: string): Tally[] {
  const found = findShow(showId);
  const counts = new Map(DEMO_OPTIONS.map((o) => [o.id, 0]));

  for (const optionId of found?.votes.values() ?? []) {
    counts.set(optionId, (counts.get(optionId) ?? 0) + 1);
  }

  return [...counts].map(([optionId, count]) => ({ optionId, count }));
}

export function demoDeviceVote(showId: string, deviceId: string | null) {
  if (!deviceId) return null;
  return findShow(showId)?.votes.get(deviceId) ?? null;
}

export function demoVote(deviceId: string, optionId: string) {
  const { live } = store();
  if (!live || live.status !== "open") return { ok: false as const };

  if (live.votes.has(deviceId)) return { ok: true as const, alreadyVoted: true };

  live.votes.set(deviceId, optionId);
  return { ok: true as const, alreadyVoted: false };
}

export function demoHistory() {
  return store().past.map((show) => {
    const tallies = demoTallies(show.id);
    const total = tallies.reduce((sum, t) => sum + t.count, 0);
    const sorted = [...tallies].sort((a, b) => b.count - a.count);
    const winnerId =
      show.winnerOptionId ??
      (sorted[0] && sorted[0].count > 0 && sorted[1]?.count !== sorted[0].count
        ? sorted[0].optionId
        : null);

    return {
      id: show.id,
      name: show.name,
      total,
      winnerName: DEMO_OPTIONS.find((o) => o.id === winnerId)?.name ?? null,
      finishedAt: show.closedAt,
    };
  });
}

// --------------------------------------------------------------- mutaciones

export function demoCreateShow(name: string, casting: Casting) {
  const state = store();
  if (state.live) return { error: "Ya hay una función activa." };

  state.live = {
    id: `demo-${Date.now()}`,
    name,
    status: "idle",
    resultsVisibility: "hidden",
    winnerOptionId: null,
    casting,
    createdAt: new Date().toISOString(),
    openedAt: null,
    closedAt: null,
    votes: new Map(),
  };
  return {};
}

export function demoSetStatus(status: ShowStatus) {
  const state = store();
  if (!state.live) return { error: "No hay ninguna función activa." };

  state.live.status = status;
  if (status === "open") state.live.closedAt = null;
  if (status === "closed") state.live.closedAt = new Date().toISOString();

  if (status === "finished") {
    state.past.unshift(state.live);
    state.live = null;
  }
  return {};
}

export function demoSetVisibility(visibility: ResultsVisibility) {
  const { live } = store();
  if (!live) return { error: "No hay ninguna función activa." };

  live.resultsVisibility = visibility;
  return {};
}

export function demoSetCasting(casting: Casting) {
  const { live } = store();
  if (!live) return { error: "No hay ninguna función activa." };

  live.casting = casting;
  return {};
}

export function demoSetWinner(optionId: string | null) {
  const { live } = store();
  if (!live) return { error: "No hay ninguna función activa." };

  live.winnerOptionId = optionId;
  return {};
}

export function demoResetVotes() {
  const { live } = store();
  if (!live) return { error: "No hay ninguna función activa." };

  live.votes.clear();
  live.winnerOptionId = null;
  return {};
}

function findShow(showId: string): DemoShow | null {
  const state = store();
  if (state.live?.id === showId) return state.live;
  return state.past.find((s) => s.id === showId) ?? null;
}
