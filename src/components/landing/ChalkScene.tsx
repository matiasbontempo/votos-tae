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
 * arriba de la cabeza y dos apoyados en el piso, a la altura de la cadera y
 * de los pies. Las tres posiciones se midieron contra el trazo: la que menos
 * aire tiene deja 30 px, y ninguna cae encima del dibujo. Si se toca el
 * contorno hay que volver a medirlas. En celular no se usan: los marcadores
 * van en fila debajo del dibujo (ver landing.css).
 */
const SPOTS = [
  { left: "7%", top: "18%" },
  { left: "39%", top: "100%" },
  { left: "88%", top: "100%" },
];

/**
 * El contorno, de una sola linea cerrada: cabeza, cuello, hombros, los dos
 * brazos, el torso y las dos piernas, con una rodilla quebrada hacia afuera.
 * Cabeza a la izquierda, como un cuerpo tirado a lo largo de la pagina.
 *
 * No esta dibujado a mano ni se edita a mano: sale de un esqueleto
 * -articulaciones con grosor- del que se toma el borde exterior, por eso
 * hombro, axila y entrepierna empalman donde empalman en un cuerpo. El
 * esqueleto y el generador estan en scripts/contorno.mjs; para cambiar la
 * pose se toca ese archivo y se corre `npm run contorno -- --write`, que
 * reescribe esta constante y el viewBox de aca abajo.
 *
 * Es a proposito un trazo generico y sin genero (hombros y caderas casi
 * iguales, sin cintura marcada): de la victima no se adelanta nada. El
 * temblor de tiza lo pone el filtro, para que la linea no sea una curva
 * perfecta de vector.
 */
const BODY =
  "M4 142.6C6.1 152.4 22.9 164.9 34.4 167.3C46 169.6 61.7 155.2 73.5 156.7" +
  "C85.4 158.2 95.8 167.9 105.5 176.1C115.2 184.2 121.1 198.1 131.9 205.6" +
  "C142.7 213.1 157.6 215.5 170.4 220.9C183.1 226.3 195.6 232.7 208.3 238.1" +
  "C221.1 243.4 233.7 249.2 246.9 253.3C260.1 257.3 274 259.4 287.5 262.4" +
  "C301.1 265.5 314.8 267.8 328.2 271.5C341.5 275.2 355.9 284.3 367.6 284.6" +
  "C379.4 284.9 399.1 278.3 398.6 273.4C398.1 268.5 377 259.9 364.6 255.2" +
  "C352.3 250.4 337.7 248.4 324.3 244.7C311 241.1 297.6 237.2 284.3 233.3" +
  "C271 229.4 257.3 226.4 244.5 221.2C231.7 216 210.7 207.6 207.4 202.3" +
  "C204.2 196.9 215.6 191.3 225.3 189.3C235 187.2 252.3 187.9 265.6 189.8" +
  "C278.8 191.8 291.5 199.2 304.8 200.9C318.1 202.6 331.7 200 345.4 200.1" +
  "C359.1 200.3 373.1 201.2 387 201.8C400.8 202.3 414.7 203 428.6 203.4" +
  "C442.4 203.9 456.3 204.5 470.2 204.6C484.1 204.6 497.9 204 511.8 203.7" +
  "C525.7 203.4 539.6 203 553.4 202.8C567.3 202.6 582.4 198.5 595 202.3" +
  "C607.7 206.2 620.7 224.7 629.2 225.8C637.8 226.9 649.2 215.5 646.3 208.8" +
  "C643.4 202.1 624.2 191 611.8 185.5C599.4 180 585.4 178.4 571.9 175.9" +
  "C558.4 173.3 544.4 172.1 530.6 170.2C516.9 168.3 503.1 166.4 489.4 164.5" +
  "C475.7 162.5 461.9 160.5 448.2 158.4C434.5 156.2 420.8 154 407.1 151.8" +
  "C393.4 149.6 378.3 148.2 366 145.1C353.7 142.1 332.3 137.6 333.3 133.2" +
  "C334.4 128.7 359.3 123.3 372.3 118.5C385.3 113.6 398.3 108.8 411.3 104" +
  "C424.3 99.2 437 91.5 450.4 89.6C463.7 87.6 477.7 90.9 491.5 92.4" +
  "C505.2 93.9 518.9 96.4 532.7 98.4C546.4 100.4 560.5 104.3 573.9 104.4" +
  "C587.2 104.5 600.9 104.3 612.7 99C624.6 93.7 643.1 79 644.8 72.5" +
  "C646.5 66 632.2 58.5 623 60.2C613.8 61.9 602 81 589.8 82.8C577.6 84.6 563.2 74.8 549.9 70.8" +
  "C536.6 66.8 523.3 62.8 510.1 58.8C496.8 54.8 483.6 48.6 470.2 46.8" +
  "C456.8 45 443.1 46.2 429.6 48C416.1 49.8 402.6 54.5 389.1 57.7" +
  "C375.6 60.9 362.1 64.7 348.6 67.3C335 69.9 321.2 70.6 307.8 73.3" +
  "C294.5 76.1 281.6 82 268.4 84C255.2 86.1 241.4 87 228.4 85.6C215.5 84.1 193 81.6 190.6 75.5" +
  "C188.3 69.5 204.4 56.3 214.3 49.1C224.2 41.9 237.4 35 250.3 32.5" +
  "C263.2 30 278.1 32.8 291.9 34C305.7 35.3 319.7 39.3 332.9 39.9" +
  "C346.1 40.5 368.7 41.9 371 37.6C373.3 33.4 357.6 19.1 346.6 14.5" +
  "C335.7 9.8 319 11.3 305.3 9.8C291.5 8.3 277.6 6.3 263.9 5.4C250.1 4.4 235.2 0.1 222.7 4" +
  "C210.2 7.9 200.2 20.3 189.1 28.5C177.9 36.7 167 45.6 155.6 53.3" +
  "C144.2 61.1 130.1 65.6 120.6 75C111 84.4 108 105 98.2 109.9C88.4 114.8 74.8 104.8 62 104.5" +
  "C49.3 104.2 31.4 101.7 21.8 108.1C12.1 114.4 1.9 132.7 4 142.6Z";

export function ChalkScene() {
  return (
    <div className="scene">
      <svg viewBox="0 0 651 289" className="chalk" aria-hidden="true" focusable="false">
        <defs>
          <filter id="chalk-wobble" x="-5%" y="-10%" width="110%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g filter="url(#chalk-wobble)">
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
