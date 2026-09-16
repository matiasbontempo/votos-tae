import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";

import { SHOW_TITLE } from "@/lib/constants";
import { imageSize } from "@/lib/image-size";

/**
 * El titulo de la obra en el hero.
 *
 * Si el lettering del flyer esta en `public/landing/`, se usa ese archivo: es
 * el LCP de la pagina, asi que va precargado y con sus medidas puestas, para
 * que el texto de abajo no salte cuando termina de cargar. Si no esta, el
 * titulo se compone con Fraunces a imitacion: tres palabras, tres colores,
 * sombra dura. Subir el archivo alcanza; no hay que tocar codigo.
 *
 * Se aceptan varias extensiones a proposito. Antes solo miraba `wordmark.png`
 * y cualquier otra cosa la ignoraba sin decir nada: quien exportaba un WebP
 * desde Photoshop o un SVG desde Illustrator lo subia, no pasaba nada, y no
 * habia forma de darse cuenta. El orden es de mejor a peor para un lettering
 * con transparencia.
 */
const CANDIDATES = [
  "landing/wordmark.svg",
  "landing/wordmark.png",
  "landing/wordmark.webp",
  "landing/wordmark.avif",
  "landing/wordmark.jpg",
  "landing/wordmark.jpeg",
];

export interface WordmarkAsset {
  src: string;
  width: number;
  height: number;
}

/** Ruta y medidas del lettering, o null si todavia no lo subieron. */
export function wordmarkAsset(): WordmarkAsset | null {
  for (const name of CANDIDATES) {
    const path = join(process.cwd(), "public", name);
    if (!existsSync(path)) continue;

    const size = imageSize(path);
    if (!size) continue;

    return { src: `/${name}`, ...size };
  }
  return null;
}

export function Wordmark() {
  const asset = wordmarkAsset();

  if (asset) {
    return (
      <h1 className="wordmark wm">
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

  // Tres palabras, tres lineas, cada una detras de su propia mascara: suben
  // escalonadas al cargar. Con el lettering de verdad sube la imagen entera,
  // porque es un solo archivo.
  return (
    <h1 className="wordmark wordmark-text">
      {[
        ["w1", "Agravado"],
        ["w2", "por el"],
        ["w3", "Vínculo"],
      ].map(([cls, word], i) => (
        <span key={cls} className="wm" style={{ animationDelay: `${i * 90}ms` }}>
          <span className={cls}>{word}</span>
        </span>
      ))}
    </h1>
  );
}
