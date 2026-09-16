export type ShowStatus = "idle" | "open" | "closed" | "finished";

/** Que ve el publico mientras la votacion esta abierta. */
export type ResultsVisibility = "live" | "after_vote" | "hidden";

/** Variantes de la pantalla de votacion, para comparar en ensayo. */
export type VoteUI = "grid" | "swipe" | "stack";

export const VOTE_UIS: VoteUI[] = ["grid", "swipe", "stack"];

export const VOTE_UI_LABELS: Record<VoteUI, string> = {
  grid: "Grilla",
  swipe: "Swipe horizontal",
  stack: "Scroll vertical",
};

export const VISIBILITY_LABELS: Record<ResultsVisibility, string> = {
  live: "En vivo",
  after_vote: "Al votar",
  hidden: "Ocultos",
};

export const VISIBILITY_HINTS: Record<ResultsVisibility, string> = {
  live: "Todos ven las barras moverse desde el primer voto.",
  after_vote: "Cada uno ve los conteos recién después de elegir.",
  hidden: "Nadie ve los votos ajenos hasta que cerrás la votación. Es el default.",
};

export interface VoteOption {
  id: string;
  name: string;
  subtitle: string | null;
  blurb: string | null;
  color: string;
  /** Identikit ya resuelto para la funcion actual (ver `applyCasting`). */
  imageUrl: string | null;
  /** Que actor lo interpreta en la funcion actual; null si no hay elenco definido. */
  castId: string | null;
  sortOrder: number;
}

export interface Show {
  id: string;
  name: string;
  status: ShowStatus;
  resultsVisibility: ResultsVisibility;
  winnerOptionId: string | null;
  /** Que actor hace cada personaje esta noche: `{ optionId: castId }`. */
  casting: Record<string, string>;
  createdAt: string;
  openedAt: string | null;
  closedAt: string | null;
}

export interface Tally {
  optionId: string;
  count: number;
}

/** Payload que consume la pantalla publica. */
export interface PublicState {
  show: Show | null;
  options: VoteOption[];
  /** Solo viene poblado cuando el publico tiene permitido ver conteos. */
  tallies: Tally[] | null;
  /** Total de votos, tambien sujeto a visibilidad. */
  total: number | null;
  /** La opcion que voto ESTE dispositivo en esta funcion, si voto. */
  myVote: string | null;
}

export function canSeeResults(
  show: Pick<Show, "status" | "resultsVisibility">,
  hasVoted: boolean,
): boolean {
  // Cerrada o finalizada: el resultado ya es publico, no hay nada que proteger.
  if (show.status === "closed" || show.status === "finished") return true;
  if (show.status !== "open") return false;

  switch (show.resultsVisibility) {
    case "live":
      return true;
    case "after_vote":
      return hasVoted;
    case "hidden":
      return false;
  }
}
