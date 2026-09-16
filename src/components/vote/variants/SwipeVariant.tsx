"use client";

import { useEffect, useRef } from "react";

import { ConfirmBar } from "@/components/vote/ConfirmBar";
import { Identikit } from "@/components/vote/Identikit";
import { TitleEyebrow } from "@/components/vote/TitleEyebrow";
import type { VariantProps } from "@/components/vote/variants/types";

/**
 * Variante B · swipe horizontal, un sospechoso por pantalla.
 *
 * La mas teatral de las tres: cada personaje ocupa el celular entero, con su
 * color y su parrafo de acusacion. La seleccion sigue al scroll, asi que el
 * boton de abajo siempre apunta a quien estas mirando. Cuesta comparar a los
 * siete, pero para eso hay indicadores de posicion arriba.
 */
export function SwipeVariant({
  options,
  selected,
  onSelect,
  onConfirm,
  submitting,
  results,
}: VariantProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const counts = new Map(results?.tallies.map((t) => [t.optionId, t.count]));

  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.id === selected),
  );
  const selectedOption = options[activeIndex] ?? null;

  // La primera opcion queda seleccionada de entrada: nunca hay un estado en el
  // que estas mirando a alguien y el boton dice "elegí a un sospechoso".
  useEffect(() => {
    if (!selected && options.length > 0) onSelect(options[0]!.id);
  }, [selected, options, onSelect]);

  // El panel centrado manda. Se lee en scrollend cuando existe (iOS 17+,
  // Chrome 114+) y con un debounce corto de respaldo.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    let timer: ReturnType<typeof setTimeout>;

    const sync = () => {
      const index = Math.round(strip.scrollLeft / strip.clientWidth);
      const option = options[index];
      if (option) onSelect(option.id);
    };

    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(sync, 90);
    };

    strip.addEventListener("scroll", onScroll, { passive: true });
    strip.addEventListener("scrollend", sync);

    return () => {
      clearTimeout(timer);
      strip.removeEventListener("scroll", onScroll);
      strip.removeEventListener("scrollend", sync);
    };
  }, [options, onSelect]);

  const scrollTo = (index: number) => {
    stripRef.current?.scrollTo({
      left: index * stripRef.current.clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative h-screen-safe overflow-hidden">
      {/* Halo del color del personaje activo: tiñe toda la pantalla. */}
      <div
        className="pointer-events-none absolute inset-0 transition-colors duration-500"
        style={{
          background: selectedOption
            ? `radial-gradient(110% 60% at 50% 8%, color-mix(in srgb, ${selectedOption.color} 30%, transparent), transparent 70%)`
            : undefined,
        }}
      />

      <header className="absolute inset-x-0 top-0 z-20 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <TitleEyebrow className="text-center" />
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {options.map((option, i) => (
            <button
              key={option.id}
              type="button"
              aria-label={`Ir a ${option.name}`}
              onClick={() => scrollTo(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? 28 : 8,
                backgroundColor:
                  i === activeIndex ? option.color : "rgba(255,255,255,0.22)",
              }}
            />
          ))}
        </div>
      </header>

      <div ref={stripRef} className="snap-x-strip h-full">
        {options.map((option, i) => {
          const count = counts.get(option.id);

          return (
            <section
              key={option.id}
              className="snap-panel flex h-full flex-col items-center justify-end px-6 pb-28"
            >
              <div className="min-h-0 w-full max-w-[300px] flex-1 pt-24">
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
                  <p className="text-muted mt-3 text-xs tabular-nums">
                    {count} {count === 1 ? "acusación" : "acusaciones"}
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {activeIndex < options.length - 1 && (
        <p className="text-muted pointer-events-none absolute right-4 bottom-24 z-20 animate-pulse text-[11px] tracking-wide">
          deslizá →
        </p>
      )}

      <ConfirmBar
        option={selectedOption}
        onConfirm={onConfirm}
        submitting={submitting}
      />
    </div>
  );
}
