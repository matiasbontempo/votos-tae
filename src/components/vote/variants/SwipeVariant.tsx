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
 * color, su nombre y el rol que ocupa en la casa. La seleccion sigue al
 * scroll, asi que el boton de abajo siempre apunta a quien estas mirando.
 * Cuesta comparar a los siete, pero para eso hay indicadores de posicion
 * arriba.
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
  const haloFromRef = useRef<HTMLDivElement>(null);
  const haloToRef = useRef<HTMLDivElement>(null);
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

  // El halo sigue al dedo, no al indice. Dos capas con el color del panel que
  // se va y del que llega, y el scroll reparte la opacidad entre las dos: a
  // mitad de camino, mitad y mitad. Se escribe directo al DOM en cada frame,
  // sin pasar por React (un setState por evento de scroll re-renderizaria las
  // siete fichas), y lo que cambia por frame es solo la opacidad, que la
  // compone la GPU sin repintar nada.
  //
  // Antes era un halo solo, atado al indice activo: cambiaba recien cuando el
  // scroll terminaba, y de golpe, porque un degradado de fondo no se puede
  // animar con transition.
  useEffect(() => {
    const strip = stripRef.current;
    const from = haloFromRef.current;
    const to = haloToRef.current;
    if (!strip || !from || !to || options.length === 0) return;

    let raf = 0;
    let painted = -1;

    const paint = () => {
      raf = 0;
      const width = strip.clientWidth || 1;
      const progress = Math.min(Math.max(strip.scrollLeft / width, 0), options.length - 1);
      const i = Math.floor(progress);
      const j = Math.min(i + 1, options.length - 1);
      const t = progress - i;

      // Los degradados solo se reescriben al cruzar de panel; entre medio
      // alcanza con mover la opacidad.
      if (painted !== i) {
        from.style.background = halo(options[i]!.color);
        to.style.background = halo(options[j]!.color);
        painted = i;
      }
      from.style.opacity = String(1 - t);
      to.style.opacity = String(t);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };

    paint();
    strip.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      strip.removeEventListener("scroll", onScroll);
    };
  }, [options]);

  const scrollTo = (index: number) => {
    stripRef.current?.scrollTo({
      left: index * stripRef.current.clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative h-screen-safe overflow-hidden">
      {/* Halo del color del sospechoso: tiñe toda la pantalla. Dos capas que
          se cruzan con el scroll; las pinta el efecto de arriba. */}
      <div ref={haloFromRef} className="pointer-events-none absolute inset-0" />
      <div ref={haloToRef} className="pointer-events-none absolute inset-0 opacity-0" />

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

              <div className="mt-5 w-full max-w-sm shrink-0 text-center">
                {option.subtitle && (
                  <p
                    className="text-xs font-semibold tracking-[0.18em] uppercase"
                    style={{ color: option.color }}
                  >
                    {option.subtitle}
                  </p>
                )}
                <h2 className="font-display mt-2 text-[2.5rem] leading-[1.05] text-balance">
                  {option.name}
                </h2>
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

/** Degradado del halo para un color de sospechoso. */
function halo(color: string): string {
  return `radial-gradient(110% 60% at 50% 8%, color-mix(in srgb, ${color} 30%, transparent), transparent 70%)`;
}
