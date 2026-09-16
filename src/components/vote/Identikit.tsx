"use client";

import { useEffect, useRef, useState } from "react";

import { Silhouette } from "@/components/vote/Silhouette";
import type { VoteOption } from "@/lib/types";

/**
 * La ficha policial de un sospechoso: el identikit dibujado, sobre un halo del
 * color del personaje y con una huella dactilar de fondo.
 *
 * `option.imageUrl` ya viene resuelto para el elenco de la funcion (ver
 * `applyCasting`). Si no hay imagen, o el archivo todavia no esta en
 * `public/identikits/`, cae a la silueta dibujada: un identikit que falta no
 * puede dejar un hueco en pantalla la noche de la funcion. La imagen queda
 * invisible hasta que termina de cargar, para que un 404 nunca muestre el
 * icono de imagen rota ni el texto alternativo.
 *
 * `frame` suma la huella dactilar de fondo. Va en las variantes de un
 * sospechoso por pantalla; en la grilla no hay lugar. Antes tambien ponia
 * anotaciones de expediente alrededor del dibujo (numero, rasgos a mano), y
 * se sacaron: en un celular el dibujo necesita todo el ancho, y cualquier
 * texto al costado termina pisandolo y pisado por el.
 */
export function Identikit({
  option,
  index,
  frame = false,
  className = "",
}: {
  option: VoteOption;
  index: number;
  frame?: boolean;
  className?: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Si cambia el elenco con la pantalla abierta llega otra URL: hay que volver
  // a intentar, no quedarse con el "roto" de la imagen anterior.
  //
  // Y el HTML viene del servidor, asi que `load` o `error` pueden dispararse
  // antes de que React enganche los handlers (imagen en cache, o un 404 rapido).
  // Se mira el estado del elemento en vez de esperar un evento que ya paso.
  useEffect(() => {
    const img = imgRef.current;
    const done = Boolean(img?.complete);
    const ok = done && (img?.naturalWidth ?? 0) > 0;

    setLoaded(ok);
    setBroken(done && !ok);
  }, [option.imageUrl]);

  const src = broken ? null : option.imageUrl;

  return (
    <div className={`relative h-full w-full ${className}`}>
      {/* Halo del color del sospechoso, detras del dibujo. Se desvanece antes
          de llegar al borde para que el recorte del PNG no se note. */}
      {src && loaded && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[10%] top-[6%] bottom-[8%] rounded-[45%] blur-2xl"
          style={{
            background: `radial-gradient(60% 55% at 50% 42%, color-mix(in srgb, ${option.color} 38%, transparent), transparent 75%)`,
          }}
        />
      )}

      {frame && src && loaded && <Fingerprint color={option.color} seed={index} />}

      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- archivo estatico ya optimizado en public/, no hace falta el optimizador
        <img
          ref={imgRef}
          src={src}
          alt={`Identikit de ${option.name}`}
          className={`identikit-fade relative h-full w-full object-contain object-bottom transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          draggable={false}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setBroken(true)}
        />
      ) : (
        <Silhouette option={option} index={index} />
      )}
    </div>
  );
}

/**
 * Huella dactilar de fondo, como marca de agua de la ficha.
 *
 * Es un SVG con filtros, no una imagen: cero requests. Lo que la hace parecer
 * una huella y no un target de tiro son dos cosas: las elipses concentricas
 * se deforman con ruido fractal (feDisplacementMap), asi ninguna cresta es
 * una curva perfecta; y un segundo ruido, mas fino, borra tramos al azar, que
 * es lo que leen los ojos como terminaciones y bifurcaciones. Cada elipse va
 * un poco mas abajo que la anterior, para que el conjunto se abra hacia abajo
 * como un lazo y no como un remolino perfecto.
 *
 * `seed` cambia la deformacion y la ubicacion: cada sospechoso tiene una
 * huella distinta, caida en otro lugar y con otra inclinacion, como si cada
 * ficha se hubiera revelado por separado. Es determinista a proposito: el
 * mismo sospechoso siempre tiene la misma huella, sin sortear nada en cada
 * render. Tambien evita ids de filtro repetidos con siete fichas en pagina.
 */
/**
 * Donde cae la huella en cada ficha. Alterna de lado para que no se apilen
 * todas en el mismo rincon, y siempre arriba, al costado de la cabeza: es la
 * zona con aire, y ademas queda detras del dibujo, nunca del texto de abajo.
 * Los negativos sacan parte de la huella fuera del borde, como una marca que
 * no entro entera en la foto.
 */
const PLACEMENTS: {
  top: string;
  side: "left" | "right";
  offset: string;
  width: string;
  rotate: number;
}[] = [
  { top: "1%", side: "left", offset: "-10%", width: "54%", rotate: -12 },
  { top: "3%", side: "right", offset: "-12%", width: "50%", rotate: 24 },
  { top: "10%", side: "left", offset: "-4%", width: "48%", rotate: 6 },
  { top: "0%", side: "right", offset: "-6%", width: "56%", rotate: -30 },
  { top: "5%", side: "right", offset: "-9%", width: "52%", rotate: 17 },
  { top: "2%", side: "left", offset: "-3%", width: "46%", rotate: -8 },
  { top: "8%", side: "left", offset: "-8%", width: "55%", rotate: 33 },
];

function Fingerprint({ color, seed }: { color: string; seed: number }) {
  const id = `huella-${seed}`;
  const ridges = Array.from({ length: 17 }, (_, i) => 3 + i * 3.1);
  const place = PLACEMENTS[seed % PLACEMENTS.length]!;

  return (
    <svg
      aria-hidden
      viewBox="0 0 100 120"
      className="pointer-events-none absolute opacity-[0.11]"
      style={{
        top: place.top,
        ...(place.side === "left" ? { left: place.offset } : { right: place.offset }),
        width: place.width,
        transform: `rotate(${place.rotate}deg)`,
      }}
      fill="none"
      stroke={color}
      strokeWidth="1.15"
      strokeLinecap="round"
    >
      <defs>
        <filter id={id} x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="3" seed={seed * 7 + 1} result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="10" xChannelSelector="R" yChannelSelector="G" result="ridges" />
          <feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves="2" seed={seed * 7 + 4} result="fine" />
          <feColorMatrix in="fine" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 11 -4.6" result="cut" />
          <feComposite in="ridges" in2="cut" operator="in" />
        </filter>
        <radialGradient id={`${id}-fade`} cx="50%" cy="52%" r="50%">
          <stop offset="55%" stopColor="#fff" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <mask id={`${id}-tip`}>
          <ellipse cx="50" cy="60" rx="46" ry="58" fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <g filter={`url(#${id})`} mask={`url(#${id}-tip)`}>
        {ridges.map((r) => (
          <ellipse key={r} cx="50" cy={58 + r * 0.22} rx={r} ry={r * 1.28} />
        ))}
      </g>
    </svg>
  );
}
