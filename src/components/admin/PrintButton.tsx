"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="bg-brass text-ink rounded-xl px-4 py-2.5 text-sm font-semibold"
    >
      Imprimir hoja
    </button>
  );
}
