import { OPENING, TAGLINE, VENUE } from "@/lib/landing-content";

/**
 * La tira que anuncia el estreno, en bucle. Es el gesto mas de los setenta de
 * la pagina y el unico movimiento que no depende del scroll.
 *
 * El texto va dos veces: la pista mide el doble y se desplaza medio ancho, asi
 * el bucle cierra sin salto. La segunda copia es decorativa, y un lector de
 * pantalla lee la primera una sola vez.
 */
const ITEMS = [
  `Estreno ${OPENING.label}`,
  TAGLINE,
  `${VENUE.name} · ${VENUE.neighborhood}`,
  "60 minutos",
];

function Run({ hidden = false }: { hidden?: boolean }) {
  return (
    <span className="run" aria-hidden={hidden || undefined}>
      {ITEMS.map((t, i) => (
        <span key={t} className="bit">
          {t}
          <b style={{ color: ["var(--teal)", "var(--rosa)", "var(--coral)", "var(--mostaza)"][i] }}>
            ✦
          </b>
        </span>
      ))}
    </span>
  );
}

export function Ticker() {
  return (
    <div className="ticker">
      <div className="track">
        <Run />
        <Run hidden />
      </div>
    </div>
  );
}
