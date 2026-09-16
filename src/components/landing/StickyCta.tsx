"use client";

import { useEffect, useState } from "react";

/**
 * Barra fija con el boton de entradas, solo en celular y solo cuando el boton
 * del hero ya quedo arriba, fuera de la pantalla. Antes de eso seria un boton
 * repetido a diez centimetros del otro.
 */
export function StickyCta({ href, label }: { href: string; label: string }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const anchor = document.getElementById("hero-cta");
    if (!anchor) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setShown(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );
    observer.observe(anchor);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky" hidden={!shown}>
      <a className="btn btn-primary" href={href} target="_blank" rel="noopener">
        {label}
      </a>
    </div>
  );
}
