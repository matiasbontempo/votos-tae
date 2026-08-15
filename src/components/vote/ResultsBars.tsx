"use client";

import type { Tally, VoteOption } from "@/lib/types";

/**
 * Barras de resultados. Se usa en tres lugares con densidades distintas:
 * pegada al borde inferior mientras se vota (`compact`), en la pantalla de
 * "ya votaste", y en el resultado final.
 */
export function ResultsBars({
  options,
  tallies,
  total,
  myVote,
  winnerId,
  compact = false,
}: {
  options: VoteOption[];
  tallies: Tally[];
  total: number;
  myVote: string | null;
  winnerId?: string | null;
  compact?: boolean;
}) {
  const counts = new Map(tallies.map((t) => [t.optionId, t.count]));

  return (
    <ul className={compact ? "space-y-1.5" : "space-y-3"}>
      {options.map((option) => {
        const count = counts.get(option.id) ?? 0;
        // Con 0 votos las cuatro barras quedan vacias en vez de repartirse 25%.
        const pct = total > 0 ? (count / total) * 100 : 0;
        const isMine = myVote === option.id;
        const isWinner = winnerId === option.id;

        return (
          <li key={option.id}>
            <div
              className={`mb-1 flex items-baseline justify-between gap-2 ${
                compact ? "text-[11px]" : "text-sm"
              }`}
            >
              <span
                className={`truncate ${
                  isWinner
                    ? "text-brass-soft font-semibold"
                    : isMine
                      ? "text-parchment font-medium"
                      : "text-muted"
                }`}
              >
                {option.name}
                {isMine && <span className="text-brass ml-1.5">· tu voto</span>}
              </span>
              <span
                className={`shrink-0 tabular-nums ${
                  compact ? "text-muted" : "text-parchment font-semibold"
                }`}
              >
                {count}
                {!compact && total > 0 && (
                  <span className="text-muted ml-1 text-xs font-normal">
                    {Math.round(pct)}%
                  </span>
                )}
              </span>
            </div>

            <div
              className={`w-full overflow-hidden rounded-full bg-white/8 ${
                compact ? "h-1.5" : "h-2.5"
              }`}
            >
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${pct}%`,
                  backgroundColor: option.color,
                  boxShadow: isWinner ? `0 0 12px ${option.color}` : undefined,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
