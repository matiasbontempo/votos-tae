"use client";

import { ConfirmBar } from "@/components/vote/ConfirmBar";
import { Identikit } from "@/components/vote/Identikit";
import { TitleEyebrow } from "@/components/vote/TitleEyebrow";
import type { VariantProps } from "@/components/vote/variants/types";

/**
 * Variante A · grilla de dos columnas.
 *
 * Todos los sospechosos entran juntos en pantalla: es la unica de las tres
 * donde se comparan de un vistazo, y la mas rapida para alguien que ya sabe a
 * quien va a votar. A cambio, cada figura queda chica — y con siete personajes
 * son cuatro filas, que es el limite de lo que se lee a media luz.
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

  const rows = Math.max(1, Math.ceil(options.length / 2));
  // Con mas de dos filas cada tarjeta pierde la mitad del alto: bajamos la
  // tipografia antes de que el nombre empiece a chocar con la silueta.
  const dense = rows > 2;

  return (
    // Altura fija y overflow-hidden: todas las tarjetas tienen que entrar en
    // pantalla si o si. Es la premisa de esta variante — si hay que scrollear
    // para ver al ultimo sospechoso, ya es la variante C.
    <div className="flex h-screen-safe flex-col overflow-hidden px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-28">
      <header className="mb-3 shrink-0 text-center">
        <TitleEyebrow />
        <h1 className={`font-display mt-1 ${dense ? "text-xl" : "text-2xl"}`}>
          ¿Quién fue?
        </h1>
      </header>

      <div
        className="grid min-h-0 flex-1 grid-cols-2 gap-2.5"
        style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
      >
        {options.map((option, i) => {
          const isSelected = selected === option.id;
          const count = counts.get(option.id);
          // Numero impar de sospechosos: el ultimo se queda solo en su fila y
          // ocupa el ancho entero en vez de dejar un hueco.
          const isLastAlone =
            options.length % 2 === 1 && i === options.length - 1;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : option.id)}
              aria-pressed={isSelected}
              className={`relative flex min-h-0 min-w-0 flex-col items-center justify-end overflow-hidden rounded-2xl border transition-all duration-300 ${
                isLastAlone ? "col-span-2" : ""
              }`}
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
                className={`min-h-0 w-full flex-1 transition-opacity duration-300 ${
                  dense ? "pt-2" : "pt-3"
                }`}
                style={{ opacity: isSelected ? 1 : 0.62 }}
              >
                <Identikit option={option} index={i} />
              </div>

              <div
                className={`w-full bg-gradient-to-t from-black/75 to-transparent px-2 text-center ${
                  dense ? "pt-4 pb-2" : "pt-6 pb-2.5"
                }`}
              >
                <p
                  className={`font-display truncate leading-tight ${
                    dense ? "text-[13px]" : "text-[15px]"
                  }`}
                >
                  {option.name}
                </p>
                {option.subtitle && (
                  <p
                    className={`text-muted truncate tracking-wide uppercase ${
                      dense ? "text-[9px]" : "text-[10px]"
                    }`}
                  >
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
