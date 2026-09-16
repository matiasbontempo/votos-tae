import { SHOW_TITLE } from "@/lib/constants";
import { AUTHOR, DIRECTOR, LOGOS, VENUE, VENUE_LINKS } from "@/lib/landing-content";

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <ul className="logos" aria-label="Instituciones">
          {LOGOS.map((l) => (
            <li key={l.name}>
              {l.href ? (
                <a className="logo" href={l.href} target="_blank" rel="noopener">
                  {l.name}
                </a>
              ) : (
                <span className="logo">{l.name}</span>
              )}
            </li>
          ))}
        </ul>
        <div className="meta">
          <p>
            {VENUE.name} · {VENUE.street}, {VENUE.neighborhood}, {VENUE.city} ·{" "}
            <a href={`tel:${VENUE.phoneE164}`}>{VENUE.phoneDisplay}</a> ·{" "}
            <a href={VENUE_LINKS.instagram} target="_blank" rel="noopener">
              @{VENUE.instagram}
            </a>
          </p>
          <p>
            {SHOW_TITLE}, de {AUTHOR}. Dirección general: {DIRECTOR}. Ilustraciones: Kiara Aimetta.
            Diseño gráfico: Matias Bontempo.
          </p>
        </div>
      </div>
      <div className="strip" aria-hidden="true" />
    </footer>
  );
}
