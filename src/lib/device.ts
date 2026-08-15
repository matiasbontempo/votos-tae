"use client";

import { DEVICE_COOKIE, DEVICE_STORAGE_KEY } from "@/lib/constants";

/**
 * Identidad del celular. Es la que impide votar dos veces en la misma funcion.
 *
 * Se guarda en localStorage y ademas se espeja en una cookie, para que el
 * render del servidor ya sepa si este dispositivo voto y no haya un parpadeo
 * entre "elegí tu final" y "ya votaste".
 *
 * Limite conocido y aceptado: alguien decidido puede borrar el storage o entrar
 * en incognito y votar de nuevo. Para 40 butacas con la obra en escena eso no
 * es un problema real; lo que si evita es el doble voto accidental (recargar,
 * volver atras, reabrir el QR).
 */
export function getDeviceId(): string {
  let id: string | null = null;

  try {
    id = window.localStorage.getItem(DEVICE_STORAGE_KEY);
  } catch {
    // Safari en modo privado puede tirar al leer storage.
  }

  if (!id) {
    id = crypto.randomUUID();
    try {
      window.localStorage.setItem(DEVICE_STORAGE_KEY, id);
    } catch {
      // Sin persistencia el voto igual entra; solo se pierde el anti-doble-voto
      // si recarga la pagina.
    }
  }

  // Espejo en cookie para que el servidor lo lea en el primer render.
  document.cookie = `${DEVICE_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;

  return id;
}
