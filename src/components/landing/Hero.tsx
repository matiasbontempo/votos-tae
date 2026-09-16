import { ChalkScene } from "@/components/landing/ChalkScene";
import { Wordmark } from "@/components/landing/Wordmark";
import {
  COMPANY,
  OPENING,
  SEASON_END_LABEL,
  TAGLINE,
  TICKETS_URL,
  VENUE,
  type SeasonPhase,
} from "@/lib/landing-content";

export function Hero({ phase }: { phase: SeasonPhase }) {
  const where = `${VENUE.name}, ${VENUE.neighborhood}`;
  const line =
    phase === "before"
      ? `Estreno ${OPENING.label} · ${where}`
      : phase === "running"
        ? `En cartel hasta el ${SEASON_END_LABEL} · ${where}`
        : `Temporada 2026 · ${where}`;

  return (
    <header className="hero wrap">
      <p className="eyebrow">{COMPANY} presenta</p>
      <Wordmark />
      <p className="sub">{TAGLINE}</p>
      <div className="cta-row" id="hero-cta">
        {phase === "over" ? (
          <a className="btn btn-ghost" href="#la-funcion">
            Temporada terminada
          </a>
        ) : (
          <>
            <a className="btn btn-primary" href={TICKETS_URL} target="_blank" rel="noopener">
              Conseguí tu entrada
            </a>
            <a className="btn btn-ghost" href="#la-funcion">
              Ver funciones
            </a>
          </>
        )}
      </div>
      <p className="line">{line}</p>
      <ChalkScene />
    </header>
  );
}
