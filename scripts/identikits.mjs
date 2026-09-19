#!/usr/bin/env node
/**
 * Convierte los identikits originales (PNG blanco y negro con transparencia)
 * en los WebP livianos que sirve la app desde public/identikits/.
 *
 *   npm run identikits -- <carpeta-con-los-png>
 *
 * Toma cada *.png de la carpeta, lo achica a IDENTIKIT_WIDTH px de ancho (solo
 * si es mas grande: nunca agranda) y lo guarda con el mismo nombre y extension
 * .webp en public/identikits/. El nombre del archivo tiene que ser el que dice
 * `identikit` en src/lib/cast.ts: noah.png -> noah.webp, maid-a.png, maid-b.png...
 *
 * Por que estos numeros:
 *  - 900 px de ancho. El dibujo nunca se ve a mas de ~300 px CSS (el max-width
 *    de las variantes de un sospechoso por pantalla), y un celular moderno
 *    tiene pantalla 3x: 300 x 3 = 900. Mas que eso es peso que nadie ve.
 *  - WebP con perdida, calidad 82, con alpha. Para un dibujo a lapiz en grises
 *    queda indistinguible del PNG y pesa entre 5 y 10 veces menos. El PNG
 *    optimizado seria la alternativa "sin perdida", pero triplica el peso y en
 *    el wifi de un teatro lleno cada KB cuenta.
 *  - `alphaQuality` en 90: el borde recortado es lo unico que se nota si se
 *    comprime de mas.
 *
 * Usa `sharp`, que ya viene instalado como dependencia de Next.
 */
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const IDENTIKIT_WIDTH = 900;
const OUT_DIR = path.resolve("public/identikits");

const srcDir = process.argv[2];
if (!srcDir) {
  console.error("Uso: npm run identikits -- <carpeta-con-los-png>");
  process.exit(1);
}

const files = (await readdir(srcDir)).filter((f) => /\.png$/i.test(f)).sort();
if (files.length === 0) {
  console.error(`No hay archivos .png en ${srcDir}`);
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });

for (const file of files) {
  const input = path.join(srcDir, file);
  const output = path.join(OUT_DIR, file.replace(/\.png$/i, ".webp"));

  const image = sharp(input)
    // Recorta el margen transparente sobrante: asi todos los identikits llegan
    // al borde inferior del contenedor y se alinean entre si. El threshold
    // default (10) es demasiado sensible a un pixel suelto cerca de un borde
    // (ruido de exportacion): recorta ese lado casi nada y el otro entero,
    // y el dibujo termina descentrado aunque el original no lo este.
    .trim({ threshold: 50 })
    .resize({ width: IDENTIKIT_WIDTH, withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90, effort: 6 });

  const info = await image.toFile(output);
  console.log(
    `${file} -> ${path.relative(process.cwd(), output)}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`,
  );
}
