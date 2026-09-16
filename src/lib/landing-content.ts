import { CHARACTERS, identikitUrl } from "@/lib/cast";
import { SHOW_TITLE } from "@/lib/constants";

/**
 * Todo lo que dice la landing, en un solo archivo: textos, fechas, links,
 * elenco y ficha. Cambiar un horario o un nombre es editar una linea aca, sin
 * tocar componentes. Es lo que se le puede entregar al cliente.
 *
 * Fuente: la ficha de la obra en Alternativa Teatral (16/9/2026) y lo que
 * confirmo direccion. Lo que NO esta a proposito: el precio (se ve en
 * Alternativa, asi la pagina no queda vieja cuando cambia), quien hace a que
 * personaje, y los parrafos de acusacion de cada sospechoso, que son la
 * sorpresa de la sala.
 */

export const COMPANY = "Elenco TAE";

export const TAGLINE = "Un enigma policial";

/** Para buscadores y redes: dos frases, sin adjetivos de mas. */
export const DESCRIPTION =
  "Corren los 70. En una mansión, su dueña muere envenenada y todos tienen motivo. Al final, el público acusa. Estreno 19 de septiembre en Teatrarte, Villa Devoto.";

/** Sinopsis de la ficha, literal; partida en dos para que respire. */
export const SYNOPSIS = [
  "Corren los 70… La sala de una mansión se convierte en escenario de un crimen. Su dueña muere envenenada. Todo apunta a un crimen familiar: todos tienen motivo, una coartada dudosa y secretos que esconder.",
  "Es una historia de celos, ambición y traición, donde el suspenso está en lo que no se ve.",
];

export const CLAIM = "Al final, el público acusa. El final lo decide la sala.";

export const FACTS = ["60 minutos", "Público adulto", "Enigma policial"];

/** La ficha de la obra en Alternativa Teatral: es donde se compra. */
export const TICKETS_URL =
  "https://www.alternativateatral.com/obra103040-agravado-por-el-vinculo";

export const VENUE = {
  name: "Teatrarte",
  fullName: "Teatrarte Devoto",
  street: "Asunción 4168",
  neighborhood: "Villa Devoto",
  city: "Buenos Aires",
  phoneDisplay: "11 2817 9186",
  phoneE164: "+5491128179186",
  instagram: "teatrartedevoto",
  /** Se dice en la pagina: es informacion de acceso, no letra chica. */
  stairs: true,
};

export const VENUE_LINKS = {
  instagram: `https://www.instagram.com/${VENUE.instagram}`,
  maps:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(`${VENUE.name}, ${VENUE.street}, ${VENUE.neighborhood}, CABA`),
  whatsapp:
    `https://wa.me/${VENUE.phoneE164.replace("+", "")}?text=` +
    encodeURIComponent(`Hola, quiero reservar entradas para ${SHOW_TITLE}.`),
};

// ---------------------------------------------------------------------------
// Temporada
// ---------------------------------------------------------------------------

/** Argentina no tiene horario de verano: el offset es fijo todo el año. */
const UTC_OFFSET = "-03:00";

export const TIMEZONE = "America/Argentina/Buenos_Aires";

export const DURATION_MINUTES = 60;

export const OPENING = { date: "2026-09-19", label: "19 de septiembre" };

export const SEASON_LABEL = "Del 19 de septiembre al 17 de octubre";

export const SEASON_END_LABEL = "17 de octubre";

/**
 * Las 18 funciones, fecha por fecha. Un horario semanal no alcanza: la
 * temporada tiene dos horarios por dia y termina un sabado, y los buscadores
 * quieren cada funcion como un evento con su fecha.
 */
export const SEASON_DAYS = [
  {
    label: "Sábados",
    times: ["18:00", "20:00"],
    dates: ["2026-09-19", "2026-09-26", "2026-10-03", "2026-10-10", "2026-10-17"],
  },
  {
    label: "Domingos",
    times: ["17:00", "19:00"],
    dates: ["2026-09-20", "2026-09-27", "2026-10-04", "2026-10-11"],
  },
];

export interface Performance {
  /** YYYY-MM-DD, hora local de Buenos Aires. */
  date: string;
  /** HH:MM, hora local. */
  time: string;
  /** ISO 8601 con offset, listo para JSON-LD. */
  startIso: string;
  endIso: string;
  start: Date;
  end: Date;
}

export function performances(): Performance[] {
  const list: Performance[] = [];
  for (const day of SEASON_DAYS) {
    for (const date of day.dates) {
      for (const time of day.times) {
        const start = new Date(`${date}T${time}:00${UTC_OFFSET}`);
        const end = new Date(start.getTime() + DURATION_MINUTES * 60_000);
        list.push({
          date,
          time,
          start,
          end,
          startIso: `${date}T${time}:00${UTC_OFFSET}`,
          endIso: isoLocal(end),
        });
      }
    }
  }
  return list.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** La proxima funcion que todavia no empezo, o null si la temporada termino. */
export function nextPerformance(now = new Date()): Performance | null {
  return performances().find((p) => p.start > now) ?? null;
}

export function seasonOver(now = new Date()): boolean {
  const all = performances();
  return now > all[all.length - 1]!.end;
}

/** Antes del estreno, en cartel, o terminada: cambia el hero y los botones. */
export type SeasonPhase = "before" | "running" | "over";

export function seasonPhase(now = new Date()): SeasonPhase {
  if (seasonOver(now)) return "over";
  return now < performances()[0]!.start ? "before" : "running";
}

/** "sábado 19 de septiembre" */
export function formatDay(d: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TIMEZONE,
  }).format(d);
}

/** "18 hs" a partir de "18:00" */
export function formatTime(time: string): string {
  const [h, m] = time.split(":");
  return m === "00" ? `${Number(h)} hs` : `${Number(h)}:${m} hs`;
}

function isoLocal(d: Date): string {
  const local = new Date(d.getTime() - 3 * 60 * 60_000);
  return local.toISOString().replace(/\.\d{3}Z$/, UTC_OFFSET);
}

// ---------------------------------------------------------------------------
// Sospechosos
// ---------------------------------------------------------------------------

export interface Suspect {
  id: string;
  name: string;
  /** Presentacion de una linea. La acusacion, nunca: se lee en la sala. */
  role: string;
  /** El mismo color que en la app de votacion: es el puente entre las dos. */
  color: string;
  /** Archivo del identikit del elenco titular, dentro de public/identikits/. */
  identikit: string | null;
}

/** Nombres, roles y colores espejan la semilla de `options` en supabase/schema.sql. */
const SUSPECT_SEED: Omit<Suspect, "identikit">[] = [
  { id: "noah", name: "Noah Davies", role: "Detective", color: "#3b82f6" },
  { id: "maid", name: "Lady Maid", role: "Ama de llaves", color: "#10b981" },
  { id: "liam", name: "Liam Jones", role: "Mano derecha de Emily", color: "#f59e0b" },
  { id: "james", name: "James Smith", role: "Segundo esposo de Emily", color: "#8b5cf6" },
  { id: "mary", name: "Mary Caissings", role: "Esposa de John", color: "#e11d48" },
  { id: "cinthia", name: "Cinthia Murdoch", role: "Protegida de Emily", color: "#22d3ee" },
  { id: "lawrence", name: "Lawrence Caissings", role: "Hijo menor de Emily", color: "#f472b6" },
];

export const SUSPECTS: Suspect[] = SUSPECT_SEED.map((s) => ({
  ...s,
  identikit: CHARACTERS[s.id]?.cast[0]?.identikit ?? null,
}));

export { identikitUrl };

export const SUSPECTS_TITLE = "Siete sospechosos. Una sola verdad.";

export const SUSPECTS_CLOSE =
  "Las acusaciones se leen en la sala. Vos vas a señalar a uno desde tu butaca.";

// ---------------------------------------------------------------------------
// Elenco y equipo
// ---------------------------------------------------------------------------

export const TAE_BLURB =
  "Elenco TAE es el proyecto anual de Teatrarte: un grupo de alumnos seleccionados que trabaja un año entero, con encuentros semanales de investigación, hasta una presentación final. Esta obra es esa presentación.";

/** Los trece, como compañía y en el orden de la ficha. Sin personaje, por ahora. */
export const CAST = [
  "Francisco Andriano",
  "Matias Bontempo",
  "Valentina Buccio Riveros",
  "Vito Camoia",
  "Ludmila Cielo Slusarczuk",
  "Tomás Daitch",
  "Mirta Feigelmüller",
  "Paula Gazzillo",
  "Pablo Lopez",
  "Juan Manuel Crespo",
  "Lautaro Peyrouton",
  "Nahuel Valls",
  "Malena Wilfrido",
];

export const AUTHOR = "Gustavo Klimacek";
export const DIRECTOR = "Tuli Caimi";

export const CREDITS: { role: string; names: string }[] = [
  { role: "Autoría", names: AUTHOR },
  { role: "Dirección general", names: DIRECTOR },
  { role: "Ilustraciones", names: "Kiara Aimetta" },
  { role: "Iluminación", names: "Flor Rubinsky" },
  { role: "Diseño de vestuario y escenografía", names: "Gladys Giorgetti" },
  {
    role: "Realización de vestuario y escenografía",
    names: "Mariela Bettina Begue, Gladys Giorgetti, Natalia Pardo",
  },
  { role: "Adaptación de vestuario", names: "Mariela Bettina Begue, Natalia Pardo" },
  { role: "Diseño gráfico", names: "Matias Bontempo" },
  { role: "Producción", names: VENUE.fullName },
];

/** Se dice con naturalidad, en la seccion de elenco. Ni escondido ni en el hero. */
export const FRAME_LINE = "Práctica escénica de proyecto educativo.";

/**
 * Hasta que lleguen los logos en SVG, cada uno es su nombre compuesto con la
 * tipografia de la pagina. Un lockup de texto se ve deliberado; un logo
 * bajado de Instagram a baja resolucion se nota en un segundo.
 */
export const LOGOS: { name: string; href?: string }[] = [
  { name: VENUE.fullName, href: VENUE_LINKS.instagram },
  { name: "Alternativa Teatral", href: TICKETS_URL },
  { name: "Proteatro" },
  { name: "artei" },
];
