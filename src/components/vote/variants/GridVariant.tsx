"use client";

import { ConfirmBar } from "@/components/vote/ConfirmBar";
import { Silhouette } from "@/components/vote/Silhouette";
import type { VariantProps } from "@/components/vote/variants/types";

/**
 * Variante A · grilla 2x2.
 *
 * Los cuatro sospechosos entran juntos en pantalla: es la unica de las tres
 * donde se comparan de un vistazo, y la mas rapida para alguien que ya sabe a
 * quien va a votar. A cambio, cada figura queda chica.
 */
export function GridVariant({
  options,
  selected,
  onSelect,
  onConfirm,
  submitting,
  results,
}: VariantProps) {
  const counts = new Map(results?.tallies.map((t) => [t.optionId, t.count]));
  const selectedOption = options.find((o) => o.id === selected) ?? null;

  return (
    // Altura fija y overflow-hidden: las cuatro tarjetas tienen que entrar en
    // pantalla si o si. Es la premisa de esta variante — si hay que scrollear
    // para ver al cuarto sospechoso, ya es la variante C.
    <div className="flex h-screen-safe flex-col overflow-hidden px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-28">
      <header className="mb-3 shrink-0 text-center">
        <p className="text-brass text-[11px] font-semibold tracking-[0.25em] uppercase">
          El veredicto
        </p>
        <h1 className="font-display mt-1 text-2xl">¿Quién fue?</h1>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2.5">
        {options.map((option, i) => {
          const isSelected = selected === option.id;
          const count = counts.get(option.id);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : option.id)}
              aria-pressed={isSelected}
              className="relative flex min-h-0 min-w-0 flex-col items-center justify-end overflow-hidden rounded-2xl border transition-all duration-300"
              style={{
                borderColor: isSelected ? option.color : "rgba(255,255,255,0.09)",
                backgroundColor: isSelected
                  ? `color-mix(in srgb, ${option.color} 18%, transparent)`
                  : "rgba(255,255,255,0.03)",
                transform: isSelected ? "scale(0.975)" : undefined,
                boxShadow: isSelected ? `0 0 30px -10px ${option.color}` : undefined,
              }}
            >
              <div
                className="min-h-0 w-full flex-1 pt-3 transition-opacity duration-300"
                style={{ opacity: isSelected ? 1 : 0.62 }}
              >
                <Silhouette option={option} index={i} />
              </div>

              <div className="w-full bg-gradient-to-t from-black/75 to-transparent px-2 pt-6 pb-2.5 text-center">
                <p className="font-display truncate text-[15px] leading-tight">
                  {option.name}
                </p>
                {option.subtitle && (
                  <p className="text-muted truncate text-[10px] tracking-wide uppercase">
                    {option.subtitle}
                  </p>
                )}
                {count !== undefined && (
                  <p
                    className="mt-1 text-[11px] font-semibold tabular-nums"
                    style={{ color: option.color }}
                  >
                    {count} {count === 1 ? "voto" : "votos"}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <ConfirmBar
        option={selectedOption}
        onConfirm={onConfirm}
        submitting={submitting}
      />
    </div>
  );
}
