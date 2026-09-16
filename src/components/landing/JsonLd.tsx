import { SHOW_TITLE } from "@/lib/constants";
import {
  COMPANY,
  DESCRIPTION,
  DIRECTOR,
  DURATION_MINUTES,
  TICKETS_URL,
  VENUE,
  VENUE_LINKS,
  performances,
} from "@/lib/landing-content";
import { siteUrl } from "@/lib/site";

/**
 * Datos estructurados para buscadores: la sala una vez, y cada una de las 18
 * funciones como un TheaterEvent con su fecha. La temporada tiene dos
 * horarios por dia y termina un sabado: un horario semanal no la representa.
 */
export function JsonLd() {
  const base = siteUrl();
  const theaterId = `${base}/#teatrarte`;

  const theater = {
    "@type": "PerformingArtsTheater",
    "@id": theaterId,
    name: VENUE.name,
    telephone: VENUE.phoneE164,
    sameAs: [VENUE_LINKS.instagram],
    address: {
      "@type": "PostalAddress",
      streetAddress: VENUE.street,
      addressLocality: `${VENUE.neighborhood}, ${VENUE.city}`,
      addressRegion: "CABA",
      addressCountry: "AR",
    },
  };

  const events = performances().map((p) => ({
    "@type": "TheaterEvent",
    name: SHOW_TITLE,
    description: DESCRIPTION,
    image: `${base}/opengraph-image`,
    url: `${base}/`,
    inLanguage: "es",
    startDate: p.startIso,
    endDate: p.endIso,
    duration: `PT${DURATION_MINUTES}M`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@id": theaterId },
    performer: { "@type": "TheaterGroup", name: COMPANY },
    organizer: { "@type": "Organization", name: VENUE.fullName, url: VENUE_LINKS.instagram },
    director: { "@type": "Person", name: DIRECTOR },
    offers: {
      "@type": "Offer",
      url: TICKETS_URL,
      availability: "https://schema.org/InStock",
      validFrom: "2026-09-01T00:00:00-03:00",
    },
  }));

  const graph = { "@context": "https://schema.org", "@graph": [theater, ...events] };

  return (
    <script
      type="application/ld+json"
      // Contenido propio y estatico: no hay entrada de usuario que escapar.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
