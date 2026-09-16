import { Cast } from "@/components/landing/Cast";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { JsonLd } from "@/components/landing/JsonLd";
import { Schedule } from "@/components/landing/Schedule";
import { StickyCta } from "@/components/landing/StickyCta";
import { Suspects } from "@/components/landing/Suspects";
import { TheCase } from "@/components/landing/TheCase";
import { TICKETS_URL, seasonPhase } from "@/lib/landing-content";

/**
 * La landing de la obra: la pagina es la escena del crimen y se recorre por
 * sus marcadores de evidencia. Primero el caso, despues los siete sospechosos
 * (los mismos que el publico acusa desde la butaca), al final la funcion y la
 * entrada. Nunca linkea a /votar: la unica puerta a la votacion es el QR.
 *
 * Estatica, regenerada a lo sumo una vez por hora: asi «proxima funcion» y el
 * fin de temporada cambian solos, sin deploy.
 */
export const revalidate = 3600;

export default function LandingPage() {
  const phase = seasonPhase();

  return (
    <>
      <main>
        <Hero phase={phase} />
        <TheCase />
        <Suspects />
        <Schedule phase={phase} />
        <Cast />
      </main>
      <Footer />
      {phase !== "over" && <StickyCta href={TICKETS_URL} label="Conseguí tu entrada" />}
      <JsonLd />
    </>
  );
}
