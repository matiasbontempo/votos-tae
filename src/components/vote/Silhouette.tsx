import type { VoteOption } from "@/lib/types";

/**
 * Marcador de posicion para la foto recortada del actor.
 *
 * Cuando existan los PNG con fondo transparente se cargan en
 * `options.image_url` y este componente los usa en lugar del dibujo. Las cuatro
 * siluetas son distintas entre si a proposito: sirven para juzgar si la
 * pantalla se lee de un vistazo, que es lo unico que importa a oscuras.
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
  if (option.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- recortes servidos desde Supabase Storage, sin optimizar
      <img
        src={option.imageUrl}
        alt={option.name}
        className={`h-full w-full object-contain object-bottom ${className}`}
        draggable={false}
      />
    );
  }

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

function Headwear({ index }: { index: number }) {
  switch (index % 4) {
    // Sombrero cloche
    case 0:
      return (
        <>
          <ellipse cx="100" cy="82" rx="47" ry="32" />
          <ellipse cx="100" cy="100" rx="56" ry="11" />
        </>
      );
    // Fedora
    case 1:
      return (
        <>
          <ellipse cx="100" cy="76" rx="70" ry="11" />
          <path d="M68 78 L68 44 Q68 30 100 30 Q132 30 132 44 L132 78 Z" />
        </>
      );
    // Rodete
    case 2:
      return (
        <>
          <circle cx="100" cy="52" r="21" />
          <path d="M60 116 Q56 58 100 58 Q144 58 140 116 Q140 84 100 84 Q60 84 60 116 Z" />
        </>
      );
    // Gorra de servicio
    default:
      return (
        <>
          <ellipse cx="100" cy="82" rx="60" ry="9" />
          <path d="M66 84 L66 56 Q66 42 100 42 Q134 42 134 56 L134 84 Z" />
        </>
      );
  }
}
