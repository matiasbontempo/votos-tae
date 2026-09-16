import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { wordmarkAsset } from "@/components/landing/Wordmark";
import { SHOW_TITLE } from "@/lib/constants";
import { COMPANY, OPENING, TAGLINE, VENUE } from "@/lib/landing-content";

/**
 * La imagen que aparece al compartir el link por WhatsApp o Instagram. Se
 * genera en build: fondo negro, las cuatro franjas, el titulo y la fecha.
 *
 * Cuando el lettering del flyer esta en public/landing/wordmark.png, lo usa;
 * hasta entonces compone el titulo con Fraunces, igual que el hero. Las dos
 * fuentes van en _og/ en WOFF porque el renderizador no lee WOFF2.
 */
export const alt = `${SHOW_TITLE} · ${COMPANY} · ${VENUE.fullName}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const OG_DIR = join(process.cwd(), "src/app/(landing)/_og");

/**
 * El lettering, embebido como data URI: el renderizador de esta imagen no sale
 * a la red, asi que el archivo tiene que viajar adentro.
 *
 * Solo PNG y JPEG. El motor que dibuja esta imagen (satori) no entiende WebP
 * ni AVIF ni SVG, y no falla suave: tira "u2 is not iterable" y se lleva
 * puesto el build entero. Con cualquier otro formato se devuelve null y la
 * imagen para compartir cae al titulo compuesto con Fraunces, que se ve bien.
 * El try tapa el resto de lo imprevisto por la misma razon: esta pagina no se
 * puede caer por un archivo que alguien subio con otra extension.
 */
async function inlineWordmark(src: string): Promise<string | null> {
  const type = src.endsWith(".png")
    ? "image/png"
    : /\.jpe?g$/.test(src)
      ? "image/jpeg"
      : null;

  if (!type) return null;

  try {
    const bytes = await readFile(join(process.cwd(), "public", src));
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function OpenGraphImage() {
  const [fraunces, bricolage] = await Promise.all([
    readFile(join(OG_DIR, "fraunces-700-soft.woff")),
    readFile(join(OG_DIR, "bricolage-600.woff")),
  ]);

  const asset = wordmarkAsset();
  const wordmark = asset ? await inlineWordmark(asset.src) : null;

  const ink = "#0f0d0b";
  const chalk = "#f2e8d3";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: ink,
          color: chalk,
          fontFamily: "Bricolage",
        }}
      >
        <div style={{ display: "flex", width: "100%", height: 18 }}>
          <div style={{ flex: 1, background: "#33a58b" }} />
          <div style={{ flex: 1, background: "#e6497f" }} />
          <div style={{ flex: 1, background: "#ef5d3a" }} />
          <div style={{ flex: 1, background: "#f2b93f" }} />
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            padding: "24px 72px 40px",
          }}
        >
          <div style={{ fontSize: 24, letterSpacing: 6, textTransform: "uppercase", opacity: 0.75 }}>
            {`${COMPANY} presenta`}
          </div>

          {wordmark && asset ? (
            // eslint-disable-next-line @next/next/no-img-element -- ImageResponse renderiza JSX plano
            <img
              src={wordmark}
              alt=""
              width={920}
              height={Math.round((920 * asset.height) / asset.width)}
              style={{ objectFit: "contain" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                fontFamily: "Fraunces",
                lineHeight: 0.95,
                textShadow: "5px 5px 0 #000",
              }}
            >
              <div style={{ fontSize: 132, color: "#33a58b" }}>Agravado</div>
              <div style={{ fontSize: 60, color: "#e6497f", marginTop: 6 }}>por el</div>
              <div style={{ fontSize: 132, color: "#ef5d3a" }}>Vínculo</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 18, fontSize: 30, marginTop: 8 }}>
            <span>{TAGLINE}</span>
            <span style={{ opacity: 0.45 }}>·</span>
            <span>{`Estreno ${OPENING.label}`}</span>
            <span style={{ opacity: 0.45 }}>·</span>
            <span>{`${VENUE.name}, ${VENUE.neighborhood}`}</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: fraunces, weight: 700, style: "normal" },
        { name: "Bricolage", data: bricolage, weight: 600, style: "normal" },
      ],
    },
  );
}
