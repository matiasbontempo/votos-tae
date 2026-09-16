import { Fragment, type CSSProperties } from "react";

import { SectionHead } from "@/components/landing/SectionHead";
import { CAST, CREDITS, FRAME_LINE, TAE_BLURB, VENUE } from "@/lib/landing-content";

export function Cast() {
  return (
    <section className="section wrap" id="elenco" style={{ "--accent": "var(--mostaza)" } as CSSProperties}>
      <SectionHead title="Elenco y equipo" />
      <p className="tae">{TAE_BLURB}</p>
      <p className="frame">
        {FRAME_LINE} Producción: {VENUE.fullName}.
      </p>
      <ul className="names">
        {CAST.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      <dl className="credits">
        {CREDITS.map((c) => (
          <Fragment key={c.role}>
            <dt>{c.role}</dt>
            <dd>{c.names}</dd>
          </Fragment>
        ))}
      </dl>
    </section>
  );
}
