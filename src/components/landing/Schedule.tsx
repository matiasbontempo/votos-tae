import type { CSSProperties } from "react";

import { SectionHead } from "@/components/landing/SectionHead";
import {
  DURATION_MINUTES,
  SEASON_DAYS,
  SEASON_LABEL,
  TICKETS_URL,
  VENUE,
  VENUE_LINKS,
  formatDay,
  formatTime,
  nextPerformance,
  performances,
  type SeasonPhase,
} from "@/lib/landing-content";

/** "18 y 20 hs" a partir de ["18:00", "20:00"]. */
function hours(times: string[]): { numbers: string; unit: string } {
  return { numbers: times.map((t) => String(Number(t.split(":")[0]))).join(" y "), unit: "hs" };
}

export function Schedule({ phase }: { phase: SeasonPhase }) {
  const next = nextPerformance();
  const total = performances().length;

  return (
    <section className="section wrap" id="la-funcion" style={{ "--accent": "var(--coral)" } as CSSProperties}>
      <SectionHead n={2} title="La función" />
      <div className="split">
        <div>
          <div className="hours reveal">
            {SEASON_DAYS.map((d) => {
              const h = hours(d.times);
              return (
                <div key={d.label}>
                  <span className="day">{d.label}</span>
                  <span className="t">
                    {h.numbers}
                    <small>{h.unit}</small>
                  </span>
                </div>
              );
            })}
          </div>
          <p className="season">
            {SEASON_LABEL} · {total} funciones · {DURATION_MINUTES} minutos
          </p>
          {phase === "over" ? (
            <p className="next">Temporada terminada. Gracias por venir.</p>
          ) : (
            next && (
              <p className="next">
                Próxima función: {formatDay(next.start)}, {formatTime(next.time)}
              </p>
            )
          )}
          {phase !== "over" && (
            <div className="cta-block">
              <a className="btn btn-primary" href={TICKETS_URL} target="_blank" rel="noopener">
                Conseguí tu entrada
              </a>
              <p className="hint">Las entradas se compran en Alternativa Teatral.</p>
            </div>
          )}
        </div>

        <aside className="venue reveal" aria-label="La sala">
          <h3>{VENUE.name}</h3>
          <p className="addr">
            {VENUE.street}, {VENUE.neighborhood}
            <br />
            {VENUE.city}
          </p>
          {VENUE.stairs && (
            <p className="note">
              <strong>La sala tiene escaleras.</strong> Cualquier duda de acceso, por WhatsApp.
            </p>
          )}
          <div className="chips">
            <a className="chip" href={VENUE_LINKS.maps} target="_blank" rel="noopener">
              Cómo llegar
            </a>
            <a className="chip" href={VENUE_LINKS.whatsapp} target="_blank" rel="noopener">
              WhatsApp {VENUE.phoneDisplay}
            </a>
            <a className="chip" href={VENUE_LINKS.instagram} target="_blank" rel="noopener">
              @{VENUE.instagram}
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}
