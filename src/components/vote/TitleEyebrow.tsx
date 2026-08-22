import { SHOW_TITLE } from "@/lib/constants";

/**
 * El titulo de la obra arriba de la pantalla de votacion.
 *
 * Va mas chico y con menos tracking que el resto de los volados: "Asesinato en
 * la Mansion Greenstout" en versalitas espaciadas no entra en una linea en un
 * celular angosto, y en la variante grilla cada linea extra le come alto a las
 * tarjetas.
 */
export function TitleEyebrow({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-brass text-[10px] font-semibold tracking-[0.18em] uppercase ${className}`}
    >
      {SHOW_TITLE}
    </p>
  );
}
