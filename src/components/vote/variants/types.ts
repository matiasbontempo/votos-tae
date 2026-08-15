import type { Tally, VoteOption } from "@/lib/types";

export interface VariantProps {
  options: VoteOption[];
  /** Opcion resaltada, todavia sin confirmar. */
  selected: string | null;
  onSelect: (id: string | null) => void;
  /** Emite el voto. Es irreversible: siempre detras de un boton explicito. */
  onConfirm: (id: string) => void;
  submitting: boolean;
  /** Conteos en vivo, solo si la funcion esta en modo `live`. */
  results: { tallies: Tally[]; total: number } | null;
}
