"use client";

import { Identikit } from "@/components/vote/Identikit";
import { TitleEyebrow } from "@/components/vote/TitleEyebrow";
import type { VariantProps } from "@/components/vote/variants/types";

/**
 * Variante C · scroll vertical, un sospechoso por pantalla. Es la variante por
 * defecto.
 *
 * Gesto de feed, que es el que todo el mundo tiene incorporado, y el unico que
 * escala sin dolor a siete sospechosos: cada uno sigue ocupando el celular
 * entero. A diferencia de las otras dos no hay barra fija: el boton vive dentro
 * del panel de cada personaje y pide dos toques (el primero arma, el segundo
 * confirma). Es la variante mas dificil de votar por accidente.
 */
export function StackVariant({
  options,
  selected,
  onSelect,
  onConfirm,
  submitting,
  results,
}: VariantProps) {
  const counts = new Map(results?.tallies.map((t) => [t.optionId, t.count]));

  return (
    <div className="snap-y-strip h-screen-safe">
      {options.map((option, i) => {
        const isArmed = selected === option.id;
        const count = counts.get(option.id);

        return (
          <section
            key={option.id}
            className="relative flex h-screen-safe snap-start flex-col items-center justify-end px-6 pb-10"
            style={{
              scrollSnapStop: "always",
              background: `radial-gradient(100% 55% at 50% 10%, color-mix(in srgb, ${option.color} 26%, transparent), transparent 70%)`,
            }}
          >
            {i === 0 && (
              <TitleEyebrow className="absolute inset-x-0 top-[max(1rem,env(safe-area-inset-top))] px-14 text-center" />
            )}

            <span className="text-muted absolute top-[max(1rem,env(safe-area-inset-top))] right-5 text-[11px] tabular-nums">
              {i + 1}/{options.length}
            </span>

            <div className="min-h-0 w-full max-w-[290px] flex-1 pt-20">
              <Identikit option={option} index={i} frame />
            </div>

            <div className="mt-4 w-full max-w-sm shrink-0 text-center">
              {option.subtitle && (
                <p
                  className="text-[11px] font-semibold tracking-[0.2em] uppercase"
                  style={{ color: option.color }}
                >
                  {option.subtitle}
                </p>
              )}
              <h2 className="font-display mt-1.5 text-4xl leading-none">
                {option.name}
              </h2>
              {option.blurb && (
                <p className="text-muted mx-auto mt-3 max-w-xs text-sm leading-relaxed text-balance">
                  {option.blurb}
                </p>
              )}
              {count !== undefined && (
                <p className="text-muted mt-2 text-xs tabular-nums">
                  {count} {count === 1 ? "acusación" : "acusaciones"}
                </p>
              )}

              <button
                type="button"
                disabled={submitting}
                onClick={() => (isArmed ? onConfirm(option.id) : onSelect(option.id))}
                onBlur={() => isArmed && onSelect(null)}
                className="mt-5 flex h-14 w-full items-center justify-center rounded-full text-base font-semibold tracking-wide transition-all duration-300"
                style={{
                  backgroundColor: isArmed ? option.color : "transparent",
                  color: isArmed ? "#0b0a0f" : option.color,
                  border: `1.5px solid ${option.color}`,
                  boxShadow: isArmed ? `0 8px 30px -8px ${option.color}` : undefined,
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting && isArmed
                  ? "Registrando…"
                  : isArmed
                    ? "Tocá de nuevo para confirmar"
                    : `Acusar a ${option.name}`}
              </button>
            </div>

            {i < options.length - 1 && (
              <p className="text-muted pointer-events-none mt-4 animate-pulse text-[11px] tracking-wide">
                ↓ seguí bajando
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
