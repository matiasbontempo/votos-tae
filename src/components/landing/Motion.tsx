"use client";

import { useEffect, useRef, type CSSProperties } from "react";

import { SECTIONS } from "@/lib/landing-content";

/**
 * La capa de movimiento de la landing. Todo lo que se mueve por scroll o por
 * el mouse pasa por aca, y por un solo `requestAnimationFrame`.
 *
 * Sin libreria a proposito. La pagina ya carga medio mega de JavaScript entre
 * React y Next; GSAP con ScrollTrigger sumaba unos 70 KB para hacer cuatro
 * cosas que el navegador ya sabe hacer. Lo que si se respeta es la regla que
 * hace que se sienta bien: solo se animan `transform` y `opacity`, nada mide
 * el layout dentro del frame (las posiciones de las secciones se calculan al
 * entrar y cuando cambia el tamaño), y con `prefers-reduced-motion` no se
 * agenda ni un frame.
 *
 * Monta tres cosas fijas: la barra de progreso con las cuatro franjas, la
 * linterna que sigue al cursor, y el riel de marcadores que aparece al pasar
 * el hero en pantallas anchas.
 */
export function Motion() {
  const progressRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---------------------------------------------------------------------
    // Que seccion se esta mirando: prende su marcador en el riel y en el
    // titulo. El margen superior negativo evita que la seccion que recien
    // asoma por abajo le gane a la que ocupa la pantalla.
    // ---------------------------------------------------------------------
    const rail = railRef.current;
    const sections = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    const activeObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = e.target.id;
          const on = e.isIntersecting;
          e.target.classList.toggle("seen", on);
          rail?.querySelector(`[data-for="${id}"]`)?.classList.toggle("on", on);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    sections.forEach((el) => activeObserver.observe(el));

    if (reduced) {
      // Sin movimiento el CSS ya deja todo visible; solo queda el riel, que es
      // navegacion y no adorno.
      rail?.classList.add("up");
      return () => activeObserver.disconnect();
    }

    // ---------------------------------------------------------------------
    // Un solo bucle para el progreso, la linterna y el riel.
    // ---------------------------------------------------------------------
    const progress = progressRef.current;
    const light = lightRef.current;

    let raf = 0;
    let dirty = true;
    let scrollRange = 1;
    let heroBottom = 0;

    /**
     * Los bloques que todavia no aparecieron, con su distancia al tope del
     * documento medida una sola vez.
     *
     * Esto lo hacia un IntersectionObserver y estaba mal: si el scroll salta
     * (una flecha de teclado hasta el final, un ancla, un flick fuerte), un
     * bloque puede pasar de estar abajo de la pantalla a estar arriba sin
     * cruzarla en ningun frame. El observer no dispara nunca y el bloque queda
     * invisible para siempre. Comparando contra el scroll no hay forma de
     * saltearse ninguno: si quedo atras, se prende igual.
     */
    let pending: { el: HTMLElement; at: number }[] = [];

    // Posicion de la linterna: `to` es el cursor, `at` la persigue con retraso.
    const to = { x: innerWidth / 2, y: innerHeight * 0.35 };
    const at = { x: to.x, y: to.y };
    let following = false;

    const measure = () => {
      scrollRange = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      heroBottom = (document.querySelector(".hero") as HTMLElement | null)?.offsetHeight ?? 0;
      // Una sola lectura del layout por bloque, aca y al cambiar el tamaño.
      // Dentro del frame no se mide nada.
      pending = [...document.querySelectorAll<HTMLElement>(".reveal:not(.in)")].map((el) => ({
        el,
        at: el.getBoundingClientRect().top + window.scrollY,
      }));
      dirty = true;
    };

    const frame = () => {
      const chasing = following && (Math.abs(to.x - at.x) > 0.5 || Math.abs(to.y - at.y) > 0.5);

      if (dirty) {
        const y = window.scrollY;
        if (progress) progress.style.transform = `scaleX(${Math.min(1, y / scrollRange)})`;
        rail?.classList.toggle("up", y > heroBottom * 0.75);

        // Todo lo que quedo por encima de la linea de disparo se prende, haya
        // pasado por la pantalla o no.
        const line = y + innerHeight * 0.88;
        if (pending.length) {
          const still: typeof pending = [];
          for (const item of pending) {
            if (item.at < line) item.el.classList.add("in");
            else still.push(item);
          }
          pending = still;
        }

        dirty = false;
      }

      if (chasing && light) {
        at.x += (to.x - at.x) * 0.08;
        at.y += (to.y - at.y) * 0.08;
        light.style.transform = `translate3d(${Math.round(at.x)}px, ${Math.round(at.y)}px, 0) translate(-50%, -50%)`;
      }

      raf = chasing || dirty ? requestAnimationFrame(frame) : 0;
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onScroll = () => {
      dirty = true;
      kick();
    };

    const onPointer = (e: PointerEvent) => {
      // Solo mouse: con el dedo, la linterna se queda respirando en el centro.
      if (e.pointerType !== "mouse") return;
      if (!following) {
        following = true;
        light?.classList.add("live");
      }
      to.x = e.clientX;
      to.y = e.clientY;
      kick();
    };

    const onResize = () => {
      measure();
      kick();
    };

    measure();
    kick();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onResize);
    addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      removeEventListener("pointermove", onPointer);
      activeObserver.disconnect();
    };
  }, []);

  return (
    <>
      <div className="progress" aria-hidden="true">
        <div className="progress-fill" ref={progressRef} />
      </div>

      {/* Linterna: una luz tibia que recorre la escena. Decorativa. */}
      <div className="spotlight" ref={lightRef} aria-hidden="true" />

      <nav className="rail" ref={railRef} aria-label="Secciones">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="tent"
            data-for={s.id}
            style={{ "--c": s.color } as CSSProperties}
          >
            <span className="n" aria-hidden="true">
              {s.n}
            </span>
            <span className="sr">{s.label}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
