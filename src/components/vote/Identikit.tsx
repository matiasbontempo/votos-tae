"use client";

import { useEffect, useRef, useState } from "react";

import { Fingerprint } from "@/components/vote/Fingerprint";
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
