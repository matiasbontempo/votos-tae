import type { VoteOption } from "@/lib/types";

/**
 * Elenco e identikits de los siete sospechosos.
 *
 * Los personajes (nombre, bajada, parrafo, color) viven en la base, en
 * `options`. Lo que vive aca es lo que cambia con quien los interpreta: el
 * identikit que ve el publico.
 *
 * Cada personaje tiene una lista de actores posibles. Casi todos tienen uno
 * solo; Lady Maid y Mary Caissings tienen dos, porque en algunas fechas los
 * hace otra persona y el identikit tiene que ser el de quien esta en escena
 * esa noche. Cual de los dos se usa lo decide el panel al crear la funcion
 * (`shows.casting`, ver `applyCasting`). El primero de la lista es el default.
 *
 * Los identikits se sirven desde `public/identikits/`. Para generarlos a
 * partir de los PNG originales: `npm run identikits` (ver scripts/identikits.mjs).
 * Si el archivo todavia no esta, la pantalla muestra la silueta dibujada.
 */
export interface CastMember {
  /** Slug estable: es lo que se guarda en `shows.casting`. */
  id: string;
  /** Como se lo nombra en el panel. Poner el nombre del actor o actriz. */
  label: string;
  /** Archivo dentro de public/identikits/. null = sin identikit, silueta. */
  identikit: string | null;
}

export interface Character {
  cast: CastMember[];
}

export const CHARACTERS: Record<string, Character> = {
  noah: {
    cast: [{ id: "a", label: "Elenco titular", identikit: "noah.webp" }],
  },
  maid: {
    cast: [
      { id: "a", label: "Valenchu", identikit: "maid-a.webp" },
      { id: "b", label: "Pola", identikit: "maid-b.webp" },
    ],
  },
  liam: {
    cast: [{ id: "a", label: "Elenco titular", identikit: "liam.webp" }],
  },
  james: {
    cast: [{ id: "a", label: "Elenco titular", identikit: "james.webp" }],
  },
  mary: {
    cast: [
      { id: "a", label: "Male", identikit: "mary-a.webp" },
      { id: "b", label: "Valenchu", identikit: "mary-b.webp" },
    ],
  },
  cinthia: {
    cast: [{ id: "a", label: "Elenco titular", identikit: "cinthia.webp" }],
  },
  lawrence: {
    cast: [{ id: "a", label: "Elenco titular", identikit: "lawrence.webp" }],
  },
};

/** Ruta publica de un identikit, a partir del nombre del archivo. */
export function identikitUrl(file: string): string {
  return `/identikits/${file}`;
}

/**
 * Eleccion de elenco de una funcion: `{ optionId: castId }`. Solo hace falta
 * listar los personajes que tienen mas de un actor; los que falten usan el
 * primero de su lista.
 */
export type Casting = Record<string, string>;

/** Personajes con mas de un actor posible: los unicos que el panel pregunta. */
export function recastableOptions(options: VoteOption[]): VoteOption[] {
  return options.filter((o) => (CHARACTERS[o.id]?.cast.length ?? 0) > 1);
}

/** Actor que interpreta a un personaje en una funcion, o null si no hay elenco definido. */
export function castMemberFor(
  optionId: string,
  casting: Casting,
): CastMember | null {
  const cast = CHARACTERS[optionId]?.cast;
  if (!cast?.length) return null;

  return cast.find((m) => m.id === casting[optionId]) ?? cast[0]!;
}

/**
 * Limpia lo que llega de un formulario o de la base antes de guardarlo: se
 * queda solo con personajes conocidos y actores que existen, y descarta el
 * default para que la fila guarde unicamente lo que se eligio a mano.
 */
export function normalizeCasting(input: unknown): Casting {
  const casting: Casting = {};
  if (!input || typeof input !== "object") return casting;

  for (const [optionId, castId] of Object.entries(input as Record<string, unknown>)) {
    const cast = CHARACTERS[optionId]?.cast;
    if (!cast || typeof castId !== "string") continue;

    const member = cast.find((m) => m.id === castId);
    if (member && member !== cast[0]) casting[optionId] = member.id;
  }

  return casting;
}

/** Lee la eleccion de elenco de un formulario: un campo `cast:<optionId>` por personaje. */
export function castingFromForm(formData: FormData): Casting {
  const raw: Record<string, unknown> = {};
  for (const optionId of Object.keys(CHARACTERS)) {
    raw[optionId] = formData.get(`cast:${optionId}`);
  }
  return normalizeCasting(raw);
}

/**
 * Resuelve la imagen de cada sospechoso para una funcion concreta.
 *
 * El identikit del elenco elegido gana. Si el personaje no tiene identikit en
 * el codigo, se respeta `image_url` de la base (una foto subida a Storage). Si
 * no hay ninguna de las dos, `imageUrl` queda en null y se dibuja la silueta.
 */
export function applyCasting(options: VoteOption[], casting: Casting): VoteOption[] {
  return options.map((option) => {
    const member = castMemberFor(option.id, casting);
    if (!member) return option;

    return {
      ...option,
      castId: member.id,
      imageUrl: member.identikit ? identikitUrl(member.identikit) : option.imageUrl,
    };
  });
}
