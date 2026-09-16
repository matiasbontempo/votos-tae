import { closeSync, existsSync, openSync, readSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";

import { SHOW_TITLE } from "@/lib/constants";

/**
 * El titulo de la obra en el hero.
 *
 * Si el lettering del flyer esta en `public/landing/wordmark.png`, se usa esa
 * imagen (con transparencia, es el LCP de la pagina y va precargada). Si el
 * archivo no esta, el titulo se compone con Fraunces a imitacion: tres
 * palabras, tres colores, sombra dura. Subir el archivo alcanza: no hay que
 * tocar codigo.
 */
export const WORDMARK_FILE = "landing/wordmark.png";

export interface WordmarkAsset {
  src: string;
  width: number;
  height: number;
}

/** Ruta y medidas del lettering, leidas del encabezado del PNG; null si falta. */
export function wordmarkAsset(): WordmarkAsset | null {
  const path = join(process.cwd(), "public", WORDMARK_FILE);
  if (!existsSync(path)) return null;

  const header = Buffer.alloc(24);
  const fd = openSync(path, "r");
  try {
    readSync(fd, header, 0, 24, 0);
  } finally {
    closeSync(fd);
  }
  if (header.toString("ascii", 1, 4) !== "PNG") return null;

  return {
    src: `/${WORDMARK_FILE}`,
    width: header.readUInt32BE(16),
    height: header.readUInt32BE(20),
  };
}

export function Wordmark() {
  const asset = wordmarkAsset();

  if (asset) {
    return (
      <h1 className="wordmark">
        <Image
          src={asset.src}
          width={asset.width}
          height={asset.height}
          alt={SHOW_TITLE}
          preload
          sizes="(min-width: 900px) 820px, 92vw"
        />
      </h1>
    );
  }

  return (
    <h1 className="wordmark wordmark-text">
      <span className="w1">Agravado</span> <span className="w2">por el</span>{" "}
      <span className="w3">Vínculo</span>
    </h1>
  );
}
