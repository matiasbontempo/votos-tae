"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ResultsBars } from "@/components/vote/ResultsBars";
import { Silhouette } from "@/components/vote/Silhouette";
import { GridVariant } from "@/components/vote/variants/GridVariant";
import { StackVariant } from "@/components/vote/variants/StackVariant";
import { SwipeVariant } from "@/components/vote/variants/SwipeVariant";
import { getDeviceId } from "@/lib/device";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { PublicState, VoteUI } from "@/lib/types";

const VARIANTS = {
  grid: GridVariant,
  swipe: SwipeVariant,
  stack: StackVariant,
};

/** Respaldo cuando el websocket engancha, y cuando no. */
const POLL_CONNECTED_MS = 45_000;
const POLL_FALLBACK_MS = 8_000;

export function VoteApp({
  initialState,
  ui,
}: {
  initialState: PublicState;
  ui: VoteUI;
}) {
  const [state, setState] = useState<PublicState>(initialState);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeOk, setRealtimeOk] = useState(false);

  // En un ref ademas del state: los efectos de Realtime y polling lo necesitan
  // sin volver a suscribirse cada vez que cambia.
  const deviceIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    const id = deviceIdRef.current;
    if (!id) return;
    try {
      const res = await fetch(`/api/state?deviceId=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      if (res.ok) setState((await res.json()) as PublicState);
    } catch {
      // Sin red: se reintenta en el proximo tick del polling.
    }
  }, []);

  // El device id solo existe en el navegador. El primer render viene del
  // servidor leyendo la cookie espejo; si todavia no habia cookie (primer
  // escaneo del QR) se genera aca y se pide el estado de nuevo.
  useEffect(() => {
    const id = getDeviceId();
    deviceIdRef.current = id;
    setDeviceId(id);
    if (!initialState.myVote) void refresh();
  }, [initialState.myVote, refresh]);

  const showId = state.show?.id ?? null;
  const talliesVisible = state.tallies !== null;

  // Realtime: `shows` avisa abrir/cerrar/cambio de visibilidad, `tallies`
  // empuja cada voto nuevo. A tallies nos suscribimos solo cuando el publico
  // tiene permitido ver los numeros (ver policy en supabase/schema.sql).
  useEffect(() => {
    const supabase = supabaseBrowser();
    if (!supabase || !showId) return;

    const channel = supabase.channel(`fn-${showId}`);

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "shows" },
      () => void refresh(),
    );

    if (talliesVisible) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tallies",
          filter: `show_id=eq.${showId}`,
        },
        (payload) => {
          const row = payload.new as { option_id?: string; count?: number };
          if (!row?.option_id || typeof row.count !== "number") return;

          setState((prev) => {
            if (!prev.tallies) return prev;
            const next = prev.tallies.map((t) =>
              t.optionId === row.option_id ? { ...t, count: row.count! } : t,
            );
            return {
              ...prev,
              tallies: next,
              total: next.reduce((sum, t) => sum + t.count, 0),
            };
          });
        },
      );
    }

    channel.subscribe((status) => setRealtimeOk(status === "SUBSCRIBED"));

    return () => {
      setRealtimeOk(false);
      void supabase.removeChannel(channel);
    };
  }, [showId, talliesVisible, refresh]);

  // Red de seguridad. El wifi de un teatro lleno tira websockets, y perderse el
  // "abrio la votacion" es el unico error que no se puede permitir esta app.
  useEffect(() => {
    const every = realtimeOk ? POLL_CONNECTED_MS : POLL_FALLBACK_MS;
    const timer = setInterval(() => void refresh(), every);

    const onWake = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onWake);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onWake);
    };
  }, [realtimeOk, refresh]);

  const handleVote = useCallback(
    async (optionId: string) => {
      if (!deviceId || submitting) return;

      setSubmitting(true);
      setError(null);

      try {
        const res = await fetch("/api/vote", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ optionId, deviceId }),
        });
        const data = (await res.json()) as {
          error?: string;
          state?: PublicState;
        };

        if (data.state) setState(data.state);
        if (!res.ok) {
          setError(data.error ?? "No pudimos registrar tu voto.");
          return;
        }

        navigator.vibrate?.(35);
      } catch {
        setError("No pudimos registrar tu voto. Revisá la señal y probá de nuevo.");
      } finally {
        setSubmitting(false);
      }
    },
    [deviceId, submitting],
  );

  const { show, options, tallies, total, myVote } = state;

  // ---------------------------------------------------------------- pantallas

  if (!show || show.status === "finished") {
    return (
      <Screen
        eyebrow="El veredicto"
        title="Todavía no"
        body="Cuando llegue el momento, esta pantalla se va a despertar sola. Dejala abierta."
      />
    );
  }

  if (show.status === "idle") {
    return (
      <Screen
        eyebrow={show.name}
        title="Falta poco"
        body="La votación no abrió todavía. No cierres esta pantalla: se actualiza sola."
        pulse
      />
    );
  }

  if (show.status === "closed") {
    const winner = pickWinner(state);
    return (
      <Screen
        eyebrow={show.name}
        title={winner ? `El jurado eligió a ${winner.name}` : "Votación cerrada"}
        body={
          winner
            ? "Volvé a mirar el escenario."
            : "Se cerró la votación. Volvé a mirar el escenario."
        }
      >
        {tallies && total !== null && (
          <div className="mt-8 w-full">
            <ResultsBars
              options={options}
              tallies={tallies}
              total={total}
              myVote={myVote}
              winnerId={show.winnerOptionId ?? winner?.id ?? null}
            />
            <p className="text-muted mt-4 text-center text-xs">
              {total} {total === 1 ? "voto" : "votos"} en total
            </p>
          </div>
        )}
      </Screen>
    );
  }

  // status === "open"

  if (myVote) {
    const voted = options.find((o) => o.id === myVote);
    return (
      <Screen
        eyebrow={show.name}
        title="Tu acusación quedó registrada"
        body={
          voted
            ? `Señalaste a ${voted.name}. Ahora es cosa del resto de la sala.`
            : undefined
        }
      >
        {voted && (
          <div className="mx-auto mt-6 h-40 w-32">
            <Silhouette
              option={voted}
              index={options.findIndex((o) => o.id === voted.id)}
            />
          </div>
        )}

        {tallies && total !== null ? (
          <div className="mt-8 w-full">
            <ResultsBars
              options={options}
              tallies={tallies}
              total={total}
              myVote={myVote}
            />
            <p className="text-muted mt-4 text-center text-xs tabular-nums">
              {total} {total === 1 ? "voto" : "votos"} · sigue abierta
            </p>
          </div>
        ) : (
          <p className="text-muted mt-8 text-center text-xs">
            Los resultados se revelan cuando cierre la votación.
          </p>
        )}
      </Screen>
    );
  }

  const Variant = VARIANTS[ui];

  return (
    <main className="stage-bg min-h-screen-safe">
      <Variant
        options={options}
        selected={selected}
        onSelect={setSelected}
        onConfirm={handleVote}
        submitting={submitting}
        results={
          tallies && total !== null && show.resultsVisibility === "live"
            ? { tallies, total }
            : null
        }
      />

      {error && (
        <div
          role="alert"
          className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-md rounded-xl bg-red-950/90 px-4 py-3 text-center text-sm text-red-100 shadow-lg backdrop-blur"
        >
          {error}
        </div>
      )}
    </main>
  );
}

/** La opcion mas votada, o null si hay empate o no hay votos. */
function pickWinner(state: PublicState) {
  const { options, tallies, show } = state;

  if (show?.winnerOptionId) {
    return options.find((o) => o.id === show.winnerOptionId) ?? null;
  }
  if (!tallies) return null;

  const sorted = [...tallies].sort((a, b) => b.count - a.count);
  const top = sorted[0];
  if (!top || top.count === 0) return null;
  if (sorted[1] && sorted[1].count === top.count) return null; // empate

  return options.find((o) => o.id === top.optionId) ?? null;
}

function Screen({
  eyebrow,
  title,
  body,
  pulse = false,
  children,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  pulse?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <main className="stage-bg flex min-h-screen-safe flex-col items-center justify-center px-6 py-12">
      <div className="animate-rise w-full max-w-md text-center">
        <p className="text-brass text-[11px] font-semibold tracking-[0.25em] uppercase">
          {eyebrow}
        </p>

        <h1 className="font-display mt-3 text-3xl leading-tight text-balance">
          {title}
        </h1>

        {body && (
          <p className="text-muted mx-auto mt-4 max-w-sm text-sm leading-relaxed text-balance">
            {body}
          </p>
        )}

        {pulse && (
          <div className="mt-8 flex justify-center">
            <span className="bg-brass animate-pulse-ring text-brass block h-2.5 w-2.5 rounded-full" />
          </div>
        )}

        {children}
      </div>
    </main>
  );
}
