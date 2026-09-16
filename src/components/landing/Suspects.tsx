import { existsSync } from "node:fs";
import { join } from "node:path";
import type { CSSProperties } from "react";

import { SectionHead } from "@/components/landing/SectionHead";
import { Fingerprint, Identikit } from "@/components/vote/Identikit";
import { SUSPECTS, SUSPECTS_CLOSE, SUSPECTS_TITLE, identikitUrl } from "@/lib/landing-content";
import type { VoteOption } from "@/lib/types";

/**
 * Los siete, con el mismo dibujo, el mismo color y la misma huella que en la
 * app de votacion: son el puente entre las dos pantallas. Nombre y una linea
 * de presentacion; la acusacion no, que es la sorpresa de la sala.
 *
 * Un identikit que todavia no esta en public/identikits/ muestra la silueta
 * dibujada de la app. Se mira en disco al renderizar, asi el HTML ya sale
 * con la silueta en vez de pedir una imagen que va a dar 404.
 */
function available(file: string | null): string | null {
  if (!file) return null;
  return existsSync(join(process.cwd(), "public/identikits", file)) ? identikitUrl(file) : null;
}

export function Suspects() {
  return (
    <section className="section wrap" id="sospechosos" style={{ "--accent": "var(--rosa)" } as CSSProperties}>
      <SectionHead n={2} title={SUSPECTS_TITLE} />
      <ul className="suspects">
        {SUSPECTS.map((s, i) => {
          const option: VoteOption = {
            id: s.id,
            name: s.name,
            subtitle: s.role,
            blurb: null,
            color: s.color,
            imageUrl: available(s.identikit),
            castId: null,
            sortOrder: i + 1,
          };
          return (
            <li key={s.id}>
              <article className="card" style={{ "--c": s.color } as CSSProperties}>
                <div className="pic">
                  <div className="halo" aria-hidden="true" />
                  <Fingerprint color={s.color} seed={i} />
                  <div className="fig">
                    <Identikit option={option} index={i} halo={false} />
                  </div>
                </div>
                <h3>{s.name}</h3>
                <p className="role">{s.role}</p>
              </article>
            </li>
          );
        })}
      </ul>
      <p className="suspects-close">{SUSPECTS_CLOSE}</p>
    </section>
  );
}
