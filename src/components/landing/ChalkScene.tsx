import type { CSSProperties } from "react";

import { SECTIONS } from "@/lib/landing-content";

/**
 * La escena del crimen: el contorno de tiza acostado y, encima, los tres
 * marcadores de evidencia. Los marcadores son la navegacion de la pagina,
 * uno por seccion y del color de cada una. El contorno se dibuja solo al
 * cargar (con `prefers-reduced-motion`, ya esta dibujado).
 */
/**
 * Donde se apoya cada marcador sobre la escena, en pantallas anchas: uno
 * junto a la cabeza, uno sobre el torso y uno a los pies. Las tres posiciones
 * caen en espacio vacio, nunca sobre el trazo. En celular no se usan: los
 * marcadores van en fila debajo del dibujo (ver landing.css).
 */
const SPOTS = [
  { left: "9%", top: "100%" },
  { left: "47%", top: "28%" },
  { left: "89%", top: "100%" },
];

/**
 * Un cuerpo de perfil, cabeza a la izquierda: un brazo doblado hacia la
 * cabeza, el otro a lo largo del cuerpo, una pierna estirada y la otra
 * flexionada. Un solo trazo mas la cabeza, con un temblor de tiza por filtro
 * para que no sea una curva perfecta de vector.
 */
const BODY =
  "M118 104 Q142 92 164 90 Q176 60 198 34 Q162 20 130 30 Q108 38 114 54 " +
  "Q130 60 154 64 Q178 70 180 94 Q262 92 372 100 Q432 96 486 94 Q532 92 562 88 " +
  "Q598 82 608 100 Q562 116 486 118 Q432 122 386 130 Q422 150 462 166 " +
  "Q510 184 554 196 Q592 196 598 216 Q548 224 478 202 Q432 186 382 170 " +
  "Q352 180 336 186 Q330 202 300 206 Q230 200 160 178 Q130 168 118 152";

export function ChalkScene() {
  return (
    <div className="scene">
      <svg viewBox="24 6 596 232" className="chalk" aria-hidden="true" focusable="false">
        <defs>
          <filter id="chalk-wobble" x="-5%" y="-10%" width="110%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g filter="url(#chalk-wobble)">
          <circle className="draw draw-head" cx="78" cy="128" r="42" pathLength="100" />
          <path className="draw" d={BODY} pathLength="100" />
        </g>
      </svg>

      <nav className="markers" aria-label="Secciones de la página">
        {SECTIONS.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="tent marker"
            style={
              {
                ...SPOTS[i],
                "--c": s.color,
                "--i": i,
              } as CSSProperties
            }
          >
            <span className="n" aria-hidden="true">
              {s.n}
            </span>
            <span className="l">{s.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
