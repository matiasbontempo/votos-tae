#!/usr/bin/env node
/**
 * Genera el contorno de tiza de la landing: el cuerpo acostado que se dibuja
 * solo en el hero (src/components/landing/ChalkScene.tsx).
 *
 *   npm run contorno            imprime el path y el viewBox
 *   npm run contorno -- --write los escribe en ChalkScene.tsx
 *
 * El trazo no esta dibujado a mano. Aca abajo hay un esqueleto -articulaciones
 * con grosor- y el script se queda con su borde exterior:
 *
 *   1. cada hueso es una capsula conica (dos puntos y dos radios); la union de
 *      todas es el cuerpo, como un campo de distancia;
 *   2. marching squares saca el borde donde ese campo vale cero;
 *   3. se suaviza, se remuestrea a POINTS puntos y cada tramo se pasa a una
 *      cubica (Catmull-Rom), que es lo que entiende el atributo `d`.
 *
 * Por eso hombro, axila y entrepierna empalman donde empalman en un cuerpo, y
 * no donde uno los adivinaria a ojo. Para mover la pose se toca el esqueleto,
 * nunca el path.
 *
 * Dos decisiones que no son de dibujo:
 *  - El cuerpo es a proposito generico y sin genero: hombros y caderas casi
 *    iguales, sin cintura marcada. De la victima la landing no adelanta nada.
 *  - El esqueleto se escribe parado, con la cabeza arriba, porque asi se puede
 *    pensar en proporciones (cabeza 1/7.5 del alto, entrepierna a la mitad,
 *    rodilla al 72%). El script lo acuesta al final, cabeza a la izquierda.
 *
 * El temblor de tiza no esta en el path: lo pone el filtro del SVG, para que
 * la linea no sea una curva perfecta de vector.
 *
 * Los tres marcadores de evidencia se apoyan sobre el dibujo con posiciones
 * medidas contra este trazo (ver SPOTS en ChalkScene.tsx): si cambia la pose,
 * hay que volver a mirarlas.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/** Cuanto se corta el borde: menos paso, mas detalle y mas lento. */
const STEP = 1.2;
/** Puntos del path final. Con menos, el trazo se vuelve mas esquematico. */
const POINTS = 72;
/** Pasadas de suavizado sobre el borde crudo, antes de remuestrear. */
const SMOOTHING = 22;
/** Eje del cuerpo. El esqueleto se escribe parado y de frente. */
const CX = 165;

const COMPONENT = path.resolve("src/components/landing/ChalkScene.tsx");

/** Capsula conica: dos puntos con su grosor. Es un hueso con carne. */
const hueso = (x0, y0, r0, x1, y1, r1) => (px, py) => {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const largo = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / largo));
  return Math.hypot(px - (x0 + dx * t), py - (y0 + dy * t)) - (r0 + (r1 - r0) * t);
};

/** Un nivel del torso: cuanto mide de ancho el cuerpo a esa altura. */
const nivel = (y, medioAncho, r) => hueso(CX - medioAncho + r, y, r, CX + medioAncho - r, y, r);

/** La cabeza, que es lo unico que no es un hueso. */
const ovalo = (cx, cy, rx, ry, grados) => {
  const a = (grados * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return (px, py) => {
    const dx = px - cx;
    const dy = py - cy;
    const x = dx * cos + dy * sin;
    const y = -dx * sin + dy * cos;
    return (Math.hypot(x / rx, y / ry) - 1) * Math.min(rx, ry);
  };
};

/**
 * El esqueleto, parado y de frente, en una caja de 330 x 660. Las alturas
 * salen de las proporciones de un cuerpo: menton 13%, hombros 18%, cintura
 * 38%, entrepierna 48%, rodilla 72%, tobillo 95%.
 */
const CUERPO = [
  ovalo(CX + 3, 52, 33, 41, -7), // cabeza, apenas ladeada
  hueso(CX + 2, 90, 20, CX, 130, 22), // cuello
  hueso(CX - 14, 116, 16, CX - 48, 140, 16), // hombro izquierdo
  hueso(CX + 14, 116, 16, CX + 48, 140, 16), // hombro derecho
  // torso, nivel por nivel: hombros y caderas casi iguales, sin cintura en V
  nivel(140, 68, 16),
  nivel(166, 68, 16),
  nivel(192, 64, 16),
  nivel(216, 58, 16),
  nivel(240, 53, 16),
  nivel(262, 52, 16), // cintura
  nivel(284, 56, 16),
  nivel(304, 62, 16),
  nivel(322, 66, 16), // cadera
  // brazo derecho: codo afuera, mano cerca de la cadera pero sin tocarla
  hueso(211, 142, 18, 286, 238, 15),
  hueso(286, 238, 15, 280, 322, 12),
  hueso(280, 322, 12, 272, 366, 15),
  // brazo izquierdo: mas extendido, apenas flexionado
  hueso(119, 140, 18, 66, 250, 15),
  hueso(66, 250, 15, 40, 352, 12),
  hueso(40, 352, 12, 28, 392, 15),
  // pierna izquierda: estirada, pie volcado afuera
  hueso(135, 320, 31, 120, 470, 22),
  hueso(120, 470, 22, 112, 608, 11),
  hueso(112, 608, 11, 84, 648, 12),
  // pierna derecha: rodilla quebrada hacia afuera
  hueso(195, 320, 31, 238, 462, 22),
  hueso(238, 462, 22, 206, 606, 11),
  hueso(206, 606, 11, 238, 644, 12),
];

/** Adentro del cuerpo es negativo, afuera positivo, el borde es el cero. */
const campo = (x, y) => Math.min(...CUERPO.map((parte) => parte(x, y)));

/** El borde del campo, como una lista de segmentitos sueltos. */
function bordeCrudo() {
  const x0 = -30;
  const y0 = -30;
  const nx = Math.ceil(390 / STEP);
  const ny = Math.ceil(740 / STEP);
  const grilla = [];
  for (let j = 0; j <= ny; j++) {
    const fila = [];
    for (let i = 0; i <= nx; i++) fila.push(campo(x0 + i * STEP, y0 + j * STEP));
    grilla.push(fila);
  }

  const corte = (pa, pb, va, vb) => {
    const t = va / (va - vb);
    return [pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t];
  };

  const segmentos = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const v = [grilla[j][i], grilla[j][i + 1], grilla[j + 1][i + 1], grilla[j + 1][i]];
      let caso = 0;
      for (let k = 0; k < 4; k++) if (v[k] < 0) caso |= 1 << k;
      if (caso === 0 || caso === 15) continue;

      const ax = x0 + i * STEP;
      const ay = y0 + j * STEP;
      const bx = ax + STEP;
      const by = ay + STEP;
      const p = [
        [ax, ay],
        [bx, ay],
        [bx, by],
        [ax, by],
      ];
      const e = [
        corte(p[0], p[1], v[0], v[1]),
        corte(p[1], p[2], v[1], v[2]),
        corte(p[2], p[3], v[2], v[3]),
        corte(p[3], p[0], v[3], v[0]),
      ];
      const centro = (v[0] + v[1] + v[2] + v[3]) / 4;
      const une = (a, b) => segmentos.push([e[a], e[b]]);

      // Los dos casos ambiguos (5 y 10) se resuelven mirando el centro de la
      // celda: si no, la silueta se corta donde dos partes casi se tocan.
      switch (caso) {
        case 1: une(3, 0); break;
        case 2: une(0, 1); break;
        case 3: une(3, 1); break;
        case 4: une(1, 2); break;
        case 6: une(0, 2); break;
        case 7: une(3, 2); break;
        case 8: une(2, 3); break;
        case 9: une(2, 0); break;
        case 11: une(2, 1); break;
        case 12: une(1, 3); break;
        case 13: une(1, 0); break;
        case 14: une(0, 3); break;
        case 5:
          if (centro < 0) { une(3, 0); une(1, 2); } else { une(0, 1); une(2, 3); }
          break;
        case 10:
          if (centro < 0) { une(0, 1); une(2, 3); } else { une(3, 0); une(1, 2); }
          break;
      }
    }
  }
  return segmentos;
}

/** Enhebra los segmentitos en anillos cerrados y devuelve el mas largo. */
function anilloMasLargo(segmentos) {
  const clave = (p) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`;
  const porInicio = new Map();
  for (const s of segmentos) {
    const k = clave(s[0]);
    if (!porInicio.has(k)) porInicio.set(k, []);
    porInicio.get(k).push(s);
  }

  const usados = new Set();
  const anillos = [];
  for (const s of segmentos) {
    if (usados.has(s)) continue;
    const anillo = [s[0]];
    let actual = s;
    while (actual && !usados.has(actual)) {
      usados.add(actual);
      anillo.push(actual[1]);
      actual = (porInicio.get(clave(actual[1])) || []).find((t) => !usados.has(t));
    }
    if (anillo.length > 20) anillos.push(anillo);
  }
  anillos.sort((a, b) => b.length - a.length);

  // Mas de un anillo quiere decir que dos partes se tocan de refilon (una mano
  // contra un muslo, por ejemplo) y encierran un hueco. Se arregla separando
  // esas dos partes en el esqueleto, no aca.
  if (anillos.length !== 1) {
    console.error(`Aviso: el borde salio en ${anillos.length} anillos; se usa el mas largo.`);
  }
  return anillos[0].slice(0, -1);
}

/** Suaviza el borde crudo, que viene con el escalonado de la grilla. */
const suavizar = (puntos, pasadas) => {
  let actual = puntos;
  for (let k = 0; k < pasadas; k++) {
    actual = actual.map((p, i) => {
      const a = actual[(i - 1 + actual.length) % actual.length];
      const b = actual[(i + 1) % actual.length];
      return [(a[0] + 2 * p[0] + b[0]) / 4, (a[1] + 2 * p[1] + b[1]) / 4];
    });
  }
  return actual;
};

/** Reparte n puntos a distancias iguales a lo largo del anillo. */
const remuestrear = (puntos, n) => {
  const acumulado = [0];
  let total = 0;
  for (let i = 1; i <= puntos.length; i++) {
    const a = puntos[i - 1];
    const b = puntos[i % puntos.length];
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
    acumulado.push(total);
  }
  const salida = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const objetivo = (total * i) / n;
    while (acumulado[j + 1] < objetivo) j++;
    const t = (objetivo - acumulado[j]) / (acumulado[j + 1] - acumulado[j]);
    const a = puntos[j % puntos.length];
    const b = puntos[(j + 1) % puntos.length];
    salida.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return salida;
};

const borde = remuestrear(suavizar(anilloMasLargo(bordeCrudo()), SMOOTHING), POINTS);

// Acostarlo: girar -90 grados deja la cabeza a la izquierda. Despues se corre
// todo para que el dibujo arranque en 0,0 con 4 unidades de aire.
const acostado = borde.map(([x, y]) => [y, -x]);
const minX = Math.min(...acostado.map((p) => p[0]));
const minY = Math.min(...acostado.map((p) => p[1]));
const P = acostado.map(([x, y]) => [x - minX + 4, y - minY + 4]);
const ancho = Math.ceil(Math.max(...P.map((p) => p[0])) + 4);
const alto = Math.ceil(Math.max(...P.map((p) => p[1])) + 4);

const n = (v) => (Math.round(v * 10) / 10).toString();
let d = `M${n(P[0][0])} ${n(P[0][1])}`;
for (let i = 0; i < P.length; i++) {
  const p0 = P[(i - 1 + P.length) % P.length];
  const p1 = P[i];
  const p2 = P[(i + 1) % P.length];
  const p3 = P[(i + 2) % P.length];
  d +=
    `C${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)}` +
    ` ${n(p2[0] - (p3[0] - p1[0]) / 6)} ${n(p2[1] - (p3[1] - p1[1]) / 6)}` +
    ` ${n(p2[0])} ${n(p2[1])}`;
}
d += "Z";

const viewBox = `0 0 ${ancho} ${alto}`;

if (!process.argv.includes("--write")) {
  console.error(`viewBox="${viewBox}"  ${P.length} puntos, ${d.length} caracteres`);
  console.log(d);
  process.exit(0);
}

// Cortar el path en lineas cortas, siempre antes de un comando, asi el diff
// del componente se lee y prettier no lo pelea.
const comandos = [];
let token = "";
for (const ch of d) {
  if ((ch === "M" || ch === "C" || ch === "Z") && token) {
    comandos.push(token);
    token = ch;
  } else {
    token += ch;
  }
}
comandos.push(token);

const lineas = [];
let linea = "";
for (const c of comandos) {
  if (linea.length + c.length > 92) {
    lineas.push(linea);
    linea = c;
  } else {
    linea += c;
  }
}
lineas.push(linea);
const constante = `const BODY =\n${lineas.map((l) => `  "${l}" +`).join("\n").replace(/ \+$/, ";")}`;

const fuente = await readFile(COMPONENT, "utf8");
const constanteVieja = /const BODY =[\s\S]*?";\n/;
const viewBoxViejo = /viewBox="[^"]*"/;
if (!constanteVieja.test(fuente) || !viewBoxViejo.test(fuente)) {
  console.error(`No encontre la constante BODY o el viewBox en ${COMPONENT}.`);
  process.exit(1);
}
const salida = fuente
  .replace(constanteVieja, () => `${constante}\n`)
  .replace(viewBoxViejo, () => `viewBox="${viewBox}"`);
await writeFile(COMPONENT, salida);
console.error(
  salida === fuente
    ? `${COMPONENT} ya estaba al dia.`
    : `Escrito en ${COMPONENT}: viewBox="${viewBox}", ${d.length} caracteres de path.`,
);
