"use client";

import type { VoteOption } from "@/lib/types";

/**
 * Boton de confirmacion, compartido por las tres variantes. Nombra siempre al
 * personaje: a oscuras y apurado, "Acusar a Vera" es mucho mas dificil de
 * errar que un "Confirmar" generico.
 */
export function ConfirmBar({
  option,
  onConfirm,
  submitting,
}: {
  option: VoteOption | null;
  onConfirm: (id: string) => void;
  submitting: boolean;
}) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pt-8 pb-[max(1rem,env(safe-area-inset-bottom))]"
      style={{
        background:
          "linear-gradient(to top, var(--color-ink) 45%, transparent 100%)",
      }}
    >
      <button
        type="button"
        disabled={!option || submitting}
        onClick={() => option && onConfirm(option.id)}
        className="pointer-events-auto mx-auto flex h-14 w-full max-w-md items-center justify-center rounded-full text-base font-semibold tracking-wide transition-all duration-300 disabled:cursor-not-allowed"
        style={
          option
            ? {
                backgroundColor: option.color,
                color: "#0b0a0f",
                boxShadow: `0 8px 30px -8px ${option.color}`,
                opacity: submitting ? 0.6 : 1,
              }
            : {
                backgroundColor: "rgba(255,255,255,0.07)",
                color: "var(--color-muted)",
              }
        }
      >
        {submitting
          ? "Registrando…"
          : option
            ? `Acusar a ${option.name}`
            : "Elegí a un sospechoso"}
      </button>
    </div>
  );
}
