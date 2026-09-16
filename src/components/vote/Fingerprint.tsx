/**
 * Huella dactilar de fondo, como marca de agua de la ficha.
 *
 * Es un SVG con filtros, no una imagen: cero requests. Lo que la hace parecer
 * una huella y no un target de tiro son dos cosas: las elipses concentricas
 * se deforman con ruido fractal (feDisplacementMap), asi ninguna cresta es
 * una curva perfecta; y un segundo ruido, mas fino, borra tramos al azar, que
 * es lo que leen los ojos como terminaciones y bifurcaciones. Cada elipse va
 * un poco mas abajo que la anterior, para que el conjunto se abra hacia abajo
 * como un lazo y no como un remolino perfecto.
 *
 * `seed` cambia la deformacion y la ubicacion: cada sospechoso tiene una
 * huella distinta, caida en otro lugar y con otra inclinacion, como si cada
 * ficha se hubiera revelado por separado. Es determinista a proposito: el
 * mismo sospechoso siempre tiene la misma huella, sin sortear nada en cada
 * render. Tambien evita ids de filtro repetidos con siete fichas en pagina.
 */
/**
 * Donde cae la huella en cada ficha. Alterna de lado para que no se apilen
 * todas en el mismo rincon, y siempre arriba, al costado de la cabeza: es la
 * zona con aire, y ademas queda detras del dibujo, nunca del texto de abajo.
 * Los negativos sacan parte de la huella fuera del borde, como una marca que
 * no entro entera en la foto.
 */
const PLACEMENTS: {
  top: string;
  side: "left" | "right";
  offset: string;
  width: string;
  rotate: number;
}[] = [
  { top: "1%", side: "left", offset: "-10%", width: "54%", rotate: -12 },
  { top: "3%", side: "right", offset: "-12%", width: "50%", rotate: 24 },
  { top: "10%", side: "left", offset: "-4%", width: "48%", rotate: 6 },
  { top: "0%", side: "right", offset: "-6%", width: "56%", rotate: -30 },
  { top: "5%", side: "right", offset: "-9%", width: "52%", rotate: 17 },
  { top: "2%", side: "left", offset: "-3%", width: "46%", rotate: -8 },
  { top: "8%", side: "left", offset: "-8%", width: "55%", rotate: 33 },
];

export function Fingerprint({ color, seed }: { color: string; seed: number }) {
  const id = `huella-${seed}`;
  const ridges = Array.from({ length: 17 }, (_, i) => 3 + i * 3.1);
  const place = PLACEMENTS[seed % PLACEMENTS.length]!;

  return (
    <svg
      aria-hidden
      viewBox="0 0 100 120"
      className="pointer-events-none absolute opacity-[0.11]"
      style={{
        top: place.top,
        ...(place.side === "left" ? { left: place.offset } : { right: place.offset }),
        width: place.width,
        transform: `rotate(${place.rotate}deg)`,
      }}
      fill="none"
      stroke={color}
      strokeWidth="1.15"
      strokeLinecap="round"
    >
      <defs>
        <filter id={id} x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="3" seed={seed * 7 + 1} result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="10" xChannelSelector="R" yChannelSelector="G" result="ridges" />
          <feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves="2" seed={seed * 7 + 4} result="fine" />
          <feColorMatrix in="fine" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 11 -4.6" result="cut" />
          <feComposite in="ridges" in2="cut" operator="in" />
        </filter>
        <radialGradient id={`${id}-fade`} cx="50%" cy="52%" r="50%">
          <stop offset="55%" stopColor="#fff" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <mask id={`${id}-tip`}>
          <ellipse cx="50" cy="60" rx="46" ry="58" fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <g filter={`url(#${id})`} mask={`url(#${id}-tip)`}>
        {ridges.map((r) => (
          <ellipse key={r} cx="50" cy={58 + r * 0.22} rx={r} ry={r * 1.28} />
        ))}
      </g>
    </svg>
  );
}
