import { Fragment, type CSSProperties } from "react";

import { SectionHead } from "@/components/landing/SectionHead";
import { CAST, CREDITS, FRAME_LINE, TAE_BLURB, VENUE } from "@/lib/landing-content";

export function Cast() {
  return (
    <section className="section wrap" id="elenco" style={{ "--accent": "var(--mostaza)" } as CSSProperties}>
      <SectionHead n={3} title="Elenco y equipo" />
      <p className="tae reveal">{TAE_BLURB}</p>
      <p className="frame">
        {FRAME_LINE} Producción: {VENUE.fullName}.
      </p>
      <ul className="names reveal">
        {CAST.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      <dl className="credits reveal">
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
