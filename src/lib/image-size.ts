import { closeSync, openSync, readSync } from "node:fs";

/**
 * Ancho y alto de una imagen, leyendo solo el encabezado del archivo.
 *
 * Existe porque `next/image` necesita las medidas para reservar el lugar y no
 * mover la pagina al cargar, y el lettering de la obra entra por `public/`
 * con el nombre fijado, no como import estatico. Son unos pocos bytes por
 * formato, sin dependencias: `sharp` esta en node_modules pero no declarado en
 * package.json, y meter una dependencia nativa en el render por esto seria
 * desproporcionado.
 */
export interface ImageSize {
  width: number;
  height: number;
}

export function imageSize(path: string): ImageSize | null {
  let head: Buffer;
  try {
    head = Buffer.alloc(4096);
    const fd = openSync(path, "r");
    try {
      readSync(fd, head, 0, head.length, 0);
    } finally {
      closeSync(fd);
    }
  } catch {
    return null;
  }

  return png(head) ?? webp(head) ?? jpeg(head) ?? svg(head);
}

function png(b: Buffer): ImageSize | null {
  if (b.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

/** WebP: los tres sabores (VP8 con perdida, VP8L sin perdida, VP8X extendido). */
function webp(b: Buffer): ImageSize | null {
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") {
    return null;
  }

  const kind = b.toString("ascii", 12, 16);

  if (kind === "VP8X") {
    return { width: readUInt24LE(b, 24) + 1, height: readUInt24LE(b, 27) + 1 };
  }

  if (kind === "VP8 ") {
    return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  }

  if (kind === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }

  return null;
}

/** JPEG: recorrer los segmentos hasta el SOF, que es el que trae las medidas. */
function jpeg(b: Buffer): ImageSize | null {
  if (b.readUInt16BE(0) !== 0xffd8) return null;

  let at = 2;
  while (at + 9 < b.length) {
    if (b[at] !== 0xff) return null;

    const marker = b[at + 1]!;
    // SOF0..SOF15, salteando los que no describen una imagen.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: b.readUInt16BE(at + 5), width: b.readUInt16BE(at + 7) };
    }
    at += 2 + b.readUInt16BE(at + 2);
  }
  return null;
}

/** SVG: el viewBox manda; si no esta, width y height en el <svg>. */
function svg(b: Buffer): ImageSize | null {
  const text = b.toString("utf8");
  if (!text.includes("<svg")) return null;

  const box = /viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(text);
  if (box) return { width: Math.round(+box[1]!), height: Math.round(+box[2]!) };

  const w = /\bwidth\s*=\s*["']([\d.]+)/.exec(text);
  const h = /\bheight\s*=\s*["']([\d.]+)/.exec(text);
  if (w && h) return { width: Math.round(+w[1]!), height: Math.round(+h[1]!) };

  return null;
}

function readUInt24LE(b: Buffer, at: number): number {
  return b[at]! | (b[at + 1]! << 8) | (b[at + 2]! << 16);
}
