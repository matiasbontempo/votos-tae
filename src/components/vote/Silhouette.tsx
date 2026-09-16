import type { VoteOption } from "@/lib/types";

/**
 * Silueta dibujada por codigo, una distinta por sospechoso.
 *
 * Es el respaldo del identikit (ver `Identikit.tsx`): se muestra mientras a un
 * personaje le falte el dibujo en `public/identikits/`, o si el archivo no
 * carga. Sirve para juzgar si la pantalla se lee de un vistazo, que es lo
 * unico que importa a oscuras.
 */
export function Silhouette({
  option,
  index,
  className = "",
}: {
  option: VoteOption;
  index: number;
  className?: string;
}) {
  const fillId = `sil-fill-${option.id}`;
  const maskId = `sil-mask-${option.id}`;

  return (
    <svg
      viewBox="0 0 200 260"
      className={`h-full w-full ${className}`}
      role="img"
      aria-label={`Silueta de ${option.name}`}
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        {/* Relleno OPACO. La figura son varias formas superpuestas (sombrero
            sobre cabeza sobre cuello sobre hombros); si el relleno tuviera
            alpha, cada solape sumaria opacidad y se verian las costuras. */}
        <linearGradient
          id={fillId}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="20"
          x2="0"
          y2="260"
        >
          <stop offset="0%" stopColor={option.color} />
          <stop offset="100%" stopColor={option.color} />
        </linearGradient>

        {/* El desvanecido hacia abajo va como mascara del grupo: se aplica una
            sola vez sobre la figura ya aplanada, no forma por forma. */}
        <linearGradient
          id={`${maskId}-grad`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="20"
          x2="0"
          y2="260"
        >
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.35" />
        </linearGradient>
        <mask id={maskId}>
          <rect width="200" height="260" fill={`url(#${maskId}-grad)`} />
        </mask>
      </defs>

      <g fill={`url(#${fillId})`} mask={`url(#${maskId})`}>
        {/* Hombros, cuello y cabeza: se solapan para formar una figura sola. */}
        <path d="M14 260 C14 198 56 168 100 168 C144 168 186 198 186 260 Z" />
        <path d="M88 134 L112 134 L112 176 L88 176 Z" />
        <ellipse cx="100" cy="110" rx="40" ry="46" />
        <Headwear index={index} />
      </g>
    </svg>
  );
}

/**
 * Una cabeza distinta por sospechoso. Todas las formas se dibujan con el mismo
 * relleno opaco y se superponen libremente: la figura es plana, asi que un
 * mechon que tape la cara no se nota, solo cambia el contorno.
 */
function Headwear({ index }: { index: number }) {
  switch (index % 7) {
    // Fedora — el detective
    case 0:
      return (
        <>
          <ellipse cx="100" cy="76" rx="70" ry="11" />
          <path d="M68 78 L68 44 Q68 30 100 30 Q132 30 132 44 L132 78 Z" />
        </>
      );
    // Cofia de ama de llaves — sin ala, para que no se confunda con el sombrero
    case 1:
      return (
        <>
          <path d="M60 92 Q58 48 100 48 Q142 48 140 92 Q120 80 100 80 Q80 80 60 92 Z" />
          <ellipse cx="100" cy="88" rx="45" ry="7" />
        </>
      );
    // Pelo corto peinado al costado
    case 2:
      return (
        <path d="M58 112 Q58 58 100 58 Q142 58 142 112 Q140 84 108 80 Q80 76 58 96 Z" />
      );
    // Galera
    case 3:
      return (
        <>
          <ellipse cx="100" cy="70" rx="62" ry="10" />
          <path d="M72 70 L72 26 Q72 18 80 18 L120 18 Q128 18 128 26 L128 70 Z" />
        </>
      );
    // Rodete alto
    case 4:
      return (
        <>
          <circle cx="100" cy="52" r="21" />
          <path d="M60 116 Q56 58 100 58 Q144 58 140 116 Q140 84 100 84 Q60 84 60 116 Z" />
        </>
      );
    // Melena a los hombros
    case 5:
      return (
        <>
          <path d="M58 112 Q58 56 100 56 Q142 56 142 112 Q142 84 100 84 Q58 84 58 112 Z" />
          <path d="M58 96 Q46 148 54 174 L78 174 Q66 140 72 100 Z" />
          <path d="M142 96 Q154 148 146 174 L122 174 Q134 140 128 100 Z" />
        </>
      );
    // Pelo corto revuelto — el mas joven de la casa
    default:
      return (
        <path d="M62 110 Q56 62 84 60 Q90 44 106 56 Q140 54 138 110 Q132 82 100 80 Q72 78 62 110 Z" />
      );
  }
}
