import type { CSSProperties } from "react";

import { SectionHead } from "@/components/landing/SectionHead";
import { SuspectFigure } from "@/components/landing/SuspectFigure";
import { Fingerprint } from "@/components/vote/Fingerprint";
import { SUSPECTS, SUSPECTS_CLOSE, SUSPECTS_TITLE } from "@/lib/landing-content";
import type { VoteOption } from "@/lib/types";

/**
 * Los siete, con el mismo dibujo, el mismo color y la misma huella que en la
 * app de votacion: son el puente entre las dos pantallas. Nombre y una linea
 * de presentacion; la acusacion no, que es la sorpresa de la sala.
 *
 * Un identikit que todavia no esta en public/identikits/ muestra la silueta
 * dibujada de la app, y se reemplaza solo cuando el archivo aparece.
 */
export function Suspects() {
  return (
    <section
      className="section wrap"
      id="sospechosos"
      style={{ "--accent": "var(--rosa)" } as CSSProperties}
    >
      <SectionHead n={2} title={SUSPECTS_TITLE} />
      <ul className="suspects reveal">
        {SUSPECTS.map((s, i) => {
          const option: VoteOption = {
            id: s.id,
            name: s.name,
            subtitle: s.role,
            blurb: null,
            color: s.color,
            imageUrl: null,
            castId: null,
            sortOrder: i + 1,
          };
          return (
            <li key={s.id} style={{ "--i": i } as CSSProperties}>
              <article className="card" style={{ "--c": s.color } as CSSProperties}>
                <div className="pic">
                  <div className="halo" aria-hidden="true" />
                  <Fingerprint color={s.color} seed={i} />
                  <SuspectFigure option={option} index={i} file={s.identikit} />
                </div>
                <h3>{s.name}</h3>
                <p className="role">{s.role}</p>
              </article>
            </li>
          );
        })}
      </ul>
      <p className="suspects-close reveal">{SUSPECTS_CLOSE}</p>
    </section>
  );
}
