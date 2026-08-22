import type { Metadata, Viewport } from "next";
import "./globals.css";

import { SHOW_TITLE } from "@/lib/constants";

export const metadata: Metadata = {
  title: SHOW_TITLE,
  description: "Votá quién fue.",
};

export const viewport: Viewport = {
  themeColor: "#0b0a0f",
  width: "device-width",
  initialScale: 1,
  // Que no se pueda hacer pinch-zoom sobre los botones de voto en plena escena.
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
