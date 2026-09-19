import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";

import { Silhouette } from "@/components/vote/Silhouette";
import { identikitUrl } from "@/lib/landing-content";
import type { VoteOption } from "@/lib/types";

/**
 * El dibujo de un sospechoso en la landing.
 *
 * La app de votacion sirve los identikits tal cual desde `public/`, con un
 * `<img>` y un baile de opacidad en el cliente: ahi el archivo se muestra a
 * pantalla completa y lo que importa es que un 404 la noche de la funcion no
 * deje un hueco. Aca la ficha mide 267 px y la pagina es estatica, asi que
 * conviene al reves: se pregunta en el servidor si el archivo esta, y si esta
 * lo sirve `next/image`, que lo entrega del tamaño justo y en AVIF o WebP.
 * Un identikit pasa de 128 KB a unos 20, y no hace falta ni un byte de JS.
 *
 * Si el archivo todavia no esta, se dibuja la silueta, la misma de la app.
 */
export function SuspectFigure({
  option,
  index,
  file,
}: {
  option: VoteOption;
  index: number;
  file: string | null;
}) {
  const there = file && existsSync(join(process.cwd(), "public/identikits", file));

  if (!there || !file) {
    return (
      <div className="fig">
        <Silhouette option={option} index={index} />
      </div>
    );
  }

  return (
    <div className="fig">
      <Image
        src={identikitUrl(file)}
        alt={`Identikit de ${option.name}`}
        fill
        className="identikit-fade"
        style={{ objectFit: "cover", objectPosition: "center" }}
        sizes="(min-width: 720px) 280px, 62vw"
        draggable={false}
      />
    </div>
  );
}
