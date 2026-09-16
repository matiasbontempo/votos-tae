/** Titulo de seccion con su marcador de evidencia, el mismo que en el hero. */
export function SectionHead({ n, title }: { n?: number; title: string }) {
  return (
    <div className="section-head reveal">
      {n !== undefined && (
        <span className="tent big" aria-hidden="true">
          <span className="n">{n}</span>
        </span>
      )}
      <h2 className="display h2">{title}</h2>
    </div>
  );
}
