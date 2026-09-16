import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Fraunces } from "next/font/google";

import { SHOW_TITLE } from "@/lib/constants";
import { COMPANY, DESCRIPTION, VENUE } from "@/lib/landing-content";
import { siteUrl } from "@/lib/site";

import "./landing.css";

/**
 * Layout de la landing, y solo de la landing: las fuentes se cargan aca, asi
 * /votar y /admin no pagan un byte de Fraunces ni de Bricolage.
 *
 * Fraunces lleva los ejes SOFT y WONK ademas del peso: son los que le dan el
 * calor de los setenta del flyer. Bricolage solo el eje optico.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  variable: "--font-fraunces",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-bricolage",
  display: "swap",
});

const TITLE = `${SHOW_TITLE} · ${COMPANY} · ${VENUE.fullName}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    siteName: SHOW_TITLE,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  // La raiz era un placeholder con noindex; la landing es la pagina publica.
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0f0d0b",
  width: "device-width",
  initialScale: 1,
};

/**
 * Marca el documento antes de que pinte, para que los bloques que aparecen al
 * hacer scroll nazcan invisibles sin parpadeo. Sin JavaScript la marca nunca
 * se pone y la pagina se ve entera: es lo que ve un buscador, o alguien con
 * el JavaScript bloqueado.
 *
 * La red de seguridad importa mas que el efecto: si React no llega a
 * hidratar, o el observer no corre, a los dos segundos se saca la marca y
 * todo vuelve a ser visible. Una landing que estrena el sabado no puede
 * quedarse en blanco porque fallo un script.
 */
const REVEAL_BOOT =
  'document.documentElement.dataset.js="1";' +
  'setTimeout(function(){' +
  'if(!document.querySelector(".reveal.in"))delete document.documentElement.dataset.js;' +
  "},2000)";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`landing ${fraunces.variable} ${bricolage.variable}`}>
      <script dangerouslySetInnerHTML={{ __html: REVEAL_BOOT }} />
      {children}
    </div>
  );
}
