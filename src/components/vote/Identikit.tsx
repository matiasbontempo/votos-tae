"use client";

import { Caveat } from "next/font/google";
import { useEffect, useRef, useState } from "react";

import { Silhouette } from "@/components/vote/Silhouette";
import { CHARACTERS } from "@/lib/cast";
import type { VoteOption } from "@/lib/types";

/**
 * Letra manuscrita para las notas del margen. Se descarga en el build y se
 * sirve desde el mismo dominio, asi que en la sala no hay una request extra.
 */
const handwriting = Caveat({ subsets: ["latin"], weight: "500" });

/**
 * La ficha policial de un sospechoso: el identikit dibujado, sobre un halo del
 * color del personaje y con las anotaciones de un expediente al margen.
 *
 * `option.imageUrl` ya viene resuelto para el elenco de la funcion (ver
 * `applyCasting`). Si no hay imagen, o el archivo todavia no esta en
 * `public/identikits/`, cae a la silueta dibujada: un identikit que falta no
 * puede dejar un hueco en pantalla la noche de la funcion. La imagen queda
 * invisible hasta que termina de cargar, para que un 404 nunca muestre el
 * icono de imagen rota ni el texto alternativo.
 *
 * `frame` suma las anotaciones (numero de expediente, mansion, rasgos). Va en
 * las variantes de un sospechoso por pantalla; en la grilla no hay lugar.
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
  const traits = CHARACTERS[option.id]?.traits ?? [];

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

      {frame && src && loaded && (
        <>
          <Fingerprint color={option.color} />

          <div
            aria-hidden
            className="text-muted/70 pointer-events-none absolute top-[7%] right-0 text-right text-[10px] leading-loose tracking-[0.2em] uppercase"
          >
            <p className="border-t border-white/12 pt-1">
              Exp. {String(index + 1).padStart(2, "0")}
            </p>
            <p className="border-b border-white/12 pb-1">
              Mansión
              <br />
              Greenstout
            </p>
          </div>

          {traits.length > 0 && (
            <ul
              aria-hidden
              className={`${handwriting.className} text-parchment/60 pointer-events-none absolute top-[28%] left-0 -rotate-6 text-xl leading-tight`}
            >
              {traits.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </>
      )}

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

/** Huella dactilar apenas insinuada en el fondo de la ficha. */
function Fingerprint({ color }: { color: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      className="pointer-events-none absolute top-[4%] -left-[14%] w-[40%] opacity-[0.07]"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      {[10, 18, 26, 34, 42].map((r) => (
        <path
          key={r}
          d={`M ${50 - r} 58 A ${r} ${r * 1.15} 0 1 1 ${50 + r} 58`}
          strokeDasharray={`${r * 1.4} ${r * 0.35}`}
        />
      ))}
    </svg>
  );
}
