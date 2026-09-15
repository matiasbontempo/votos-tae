import type { Metadata } from "next";
import Link from "next/link";

import { SHOW_TITLE, VOTE_PATH } from "@/lib/constants";

/**
 * PLACEHOLDER de la landing de la obra.
 *
 * La raiz existe para la landing (sinopsis, elenco, funciones, entradas), que
 * se escribe aparte. Mientras tanto esta pagina ocupa el lugar y, sobre todo,
 * no deja varado a nadie: el que escribe el dominio pelado en vez de escanear
 * el QR tiene que poder llegar a votar igual.
 *
 * Al reemplazarla por la landing de verdad: sacar el `robots` de abajo, que
 * esta puesto para que Google no se quede con esta version de transicion.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LandingPlaceholder() {
  return (
    <main className="stage-bg min-h-screen-safe flex flex-col items-center justify-center px-6 text-center">
      <p className="text-brass text-[11px] font-semibold tracking-[0.25em] uppercase">
        Teatro
      </p>

      <h1 className="font-display text-parchment mt-3 text-4xl leading-tight sm:text-5xl">
        {SHOW_TITLE}
      </h1>

      <p className="text-muted mt-6 max-w-md text-sm leading-relaxed">
        La página de la obra está en construcción. Si viniste a votar, entrá acá.
      </p>

      <Link
        href={VOTE_PATH}
        className="bg-brass text-ink hover:bg-brass-soft mt-8 rounded-xl px-6 py-3 text-sm font-semibold transition-colors"
      >
        Ir a votar
      </Link>
    </main>
  );
}
