"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useState, useTransition } from "react";

import {
  closeVotingAction,
  createShowAction,
  finishShowAction,
  logoutAction,
  openVotingAction,
  reopenVotingAction,
  resetVotesAction,
  setVisibilityAction,
  setWinnerAction,
  type ActionResult,
} from "@/lib/actions";
import type { AdminState } from "@/lib/admin-data";
import { VOTE_PATH } from "@/lib/constants";
import {
  VISIBILITY_HINTS,
  VISIBILITY_LABELS,
  VOTE_UI_LABELS,
  VOTE_UIS,
  type ResultsVisibility,
  type ShowStatus,
} from "@/lib/types";

const POLL_MS = 2_000;

const STATUS_LABELS: Record<ShowStatus, string> = {
  idle: "Sin abrir",
  open: "Votación abierta",
  closed: "Votación cerrada",
  finished: "Finalizada",
};

const STATUS_COLORS: Record<ShowStatus, string> = {
  idle: "#9a93a6",
  open: "#10b981",
  closed: "#f59e0b",
  finished: "#6b7280",
};

export function AdminDashboard({ initialState }: { initialState: AdminState }) {
  const [state, setState] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/state", { cache: "no-store" });
      if (res.ok) setState((await res.json()) as AdminState);
    } catch {
      // El proximo tick reintenta.
    }
  }, []);

  // El panel es un solo dispositivo, asi que un poll corto sale mas barato en
  // complejidad que montar Realtime aca, y nunca se queda desfasado.
  useEffect(() => {
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  /** Corre una action, muestra su error si lo hay y re-sincroniza. */
  const run = useCallback(
    (action: () => Promise<ActionResult>) => {
      setError(null);
      startTransition(async () => {
        const result = await action();
        if (result?.error) setError(result.error);
        await refresh();
      });
    },
    [refresh],
  );

  const { show, options, tallies, total, history } = state;
  const counts = new Map(tallies.map((t) => [t.optionId, t.count]));
  const leaderIds = leaders(tallies);
  const isTie = leaderIds.length > 1;

  return (
    <main className="stage-bg min-h-screen-safe px-4 py-6 pb-16">
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-brass text-[11px] font-semibold tracking-[0.25em] uppercase">
              Backstage
            </p>
            <h1 className="font-display mt-1 text-2xl leading-tight">
              {show?.name ?? "Sin función activa"}
            </h1>
            {show && (
              <span
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium"
                style={{ color: STATUS_COLORS[show.status] }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[show.status] }}
                />
                {STATUS_LABELS[show.status]}
              </span>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <Link
              href="/admin/qr"
              className="text-muted hover:text-parchment text-xs underline underline-offset-4"
            >
              QR
            </Link>
            <button
              type="button"
              onClick={() => void logoutAction()}
              className="text-muted hover:text-parchment text-xs underline underline-offset-4"
            >
              Salir
            </button>
          </div>
        </header>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-red-950/70 px-4 py-3 text-sm text-red-100"
          >
            {error}
          </p>
        )}

        {!show ? (
          <NewShowCard />
        ) : (
          <div className="space-y-4">
            <Card title="Control de votación">
              <div className="grid grid-cols-2 gap-2">
                {show.status === "idle" && (
                  <Action
                    label="Abrir votación"
                    tone="go"
                    wide
                    disabled={pending}
                    onClick={() => run(openVotingAction)}
                  />
                )}

                {show.status === "open" && (
                  <Action
                    label="Cerrar votación"
                    tone="warn"
                    wide
                    disabled={pending}
                    onClick={() => run(closeVotingAction)}
                  />
                )}

                {show.status === "closed" && (
                  <>
                    <Action
                      label="Reabrir"
                      tone="neutral"
                      disabled={pending}
                      onClick={() => run(reopenVotingAction)}
                    />
                    <Confirmable
                      label="Finalizar función"
                      confirmLabel="Confirmar: finalizar"
                      tone="warn"
                      disabled={pending}
                      onConfirm={() => run(finishShowAction)}
                    />
                  </>
                )}
              </div>

              {show.status !== "closed" && (
                <div className="mt-2">
                  <Confirmable
                    label="Finalizar función"
                    confirmLabel="Confirmar: finalizar"
                    tone="ghost"
                    disabled={pending}
                    onConfirm={() => run(finishShowAction)}
                  />
                </div>
              )}
            </Card>

            <Card
              title="Resultados para el público"
              hint={VISIBILITY_HINTS[show.resultsVisibility]}
            >
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(VISIBILITY_LABELS) as ResultsVisibility[]).map((v) => {
                  const active = show.resultsVisibility === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => setVisibilityAction(v))}
                      className={`h-11 rounded-xl border text-xs font-medium transition-colors ${
                        active
                          ? "border-brass bg-brass/15 text-brass-soft"
                          : "text-muted hover:text-parchment border-white/10 bg-white/4"
                      }`}
                    >
                      {VISIBILITY_LABELS[v]}
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card
              title="Votos"
              hint={`${total} ${total === 1 ? "voto" : "votos"} emitidos`}
            >
              <ul className="space-y-3">
                {options.map((option) => {
                  const count = counts.get(option.id) ?? 0;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  const isLeader = leaderIds.includes(option.id);
                  const isPinned = show.winnerOptionId === option.id;

                  return (
                    <li key={option.id}>
                      <div className="mb-1 flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm">
                          {option.name}
                          {isPinned && (
                            <span className="text-brass ml-1.5 text-[11px] font-semibold">
                              · fijado
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums">
                          {count}
                          <span className="text-muted ml-1.5 text-xs font-normal">
                            {Math.round(pct)}%
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full transition-[width] duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: option.color,
                            opacity: isLeader || total === 0 ? 1 : 0.5,
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card
              title="Final que se juega"
              hint={
                show.winnerOptionId
                  ? "Fijado a mano. El público ve este final."
                  : isTie
                    ? "Hay empate: elegí vos cuál se juega."
                    : "Se toma el más votado automáticamente."
              }
            >
              {isTie && !show.winnerOptionId && (
                <p className="mb-3 rounded-lg bg-amber-950/50 px-3 py-2 text-xs text-amber-200">
                  Empate entre{" "}
                  {leaderIds
                    .map((id) => options.find((o) => o.id === id)?.name)
                    .filter(Boolean)
                    .join(" y ")}
                  .
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                {options.map((option) => {
                  const active = show.winnerOptionId === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(() => setWinnerAction(active ? null : option.id))
                      }
                      className="h-11 truncate rounded-xl border px-2 text-xs font-medium transition-colors"
                      style={{
                        borderColor: active ? option.color : "rgba(255,255,255,0.1)",
                        backgroundColor: active
                          ? `color-mix(in srgb, ${option.color} 20%, transparent)`
                          : "rgba(255,255,255,0.04)",
                        color: active ? option.color : "var(--color-muted)",
                      }}
                    >
                      {option.name}
                    </button>
                  );
                })}
              </div>

              {show.winnerOptionId && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => setWinnerAction(null))}
                  className="text-muted hover:text-parchment mt-3 text-xs underline underline-offset-4"
                >
                  Volver al conteo automático
                </button>
              )}
            </Card>

            <Card
              title="Ensayo"
              hint="Probá las tres pantallas y limpiá los votos de prueba."
            >
              <div className="mb-3 flex flex-wrap gap-2">
                {VOTE_UIS.map((v) => (
                  <a
                    key={v}
                    href={`${VOTE_PATH}?ui=${v}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted hover:text-parchment rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-xs"
                  >
                    {VOTE_UI_LABELS[v]} ↗
                  </a>
                ))}
              </div>

              <Confirmable
                label="Borrar todos los votos de esta función"
                confirmLabel="Confirmar: borrar votos"
                tone="danger"
                disabled={pending}
                onConfirm={() => run(resetVotesAction)}
              />
            </Card>
          </div>
        )}

        {history.length > 0 && (
          <section className="mt-8">
            <h2 className="text-muted mb-3 text-[11px] font-semibold tracking-[0.2em] uppercase">
              Funciones anteriores
            </h2>
            <ul className="divide-y divide-white/6 overflow-hidden rounded-xl border border-white/8 bg-white/3">
              {history.map((past) => (
                <li
                  key={past.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <span className="text-muted truncate">{past.name}</span>
                  <span className="shrink-0 text-right">
                    <span className="text-parchment">{past.winnerName ?? "—"}</span>
                    <span className="text-muted ml-2 text-xs tabular-nums">
                      {past.total}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

// ------------------------------------------------------------------- piezas

function NewShowCard() {
  const [result, formAction, pending] = useActionState(createShowAction, {});

  return (
    <Card
      title="Nueva función"
      hint="Dejá el nombre vacío para usar la fecha y hora de hoy."
    >
      <form action={formAction} className="space-y-3">
        <input
          type="text"
          name="name"
          placeholder="Ej: Sábado 21h"
          className="focus:border-brass w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-sm outline-none"
        />
        {result.error && (
          <p role="alert" className="text-sm text-red-300">
            {result.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="bg-brass text-ink h-12 w-full rounded-xl text-sm font-semibold disabled:opacity-60"
        >
          {pending ? "Creando…" : "Crear función"}
        </button>
      </form>
    </Card>
  );
}

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/8 bg-white/3 p-4">
      <h2 className="text-[11px] font-semibold tracking-[0.2em] uppercase">
        {title}
      </h2>
      {hint && <p className="text-muted mt-1 mb-3 text-xs">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

type Tone = "go" | "warn" | "danger" | "neutral" | "ghost";

const TONES: Record<Tone, string> = {
  go: "bg-emerald-500 text-ink",
  warn: "bg-amber-500 text-ink",
  danger: "bg-red-600 text-white",
  neutral: "bg-white/10 text-parchment",
  ghost: "bg-transparent border border-white/12 text-muted",
};

function Action({
  label,
  tone,
  wide = false,
  disabled,
  onClick,
}: {
  label: string;
  tone: Tone;
  wide?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`h-12 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 ${
        TONES[tone]
      } ${wide ? "col-span-2 w-full" : ""}`}
    >
      {label}
    </button>
  );
}

/** Boton de dos toques. Se desarma solo a los 4 segundos. */
function Confirmable({
  label,
  confirmLabel,
  tone,
  disabled,
  onConfirm,
}: {
  label: string;
  confirmLabel: string;
  tone: Tone;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <Action
      label={armed ? confirmLabel : label}
      tone={armed ? "danger" : tone}
      wide
      disabled={disabled}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
    />
  );
}

/** Todas las opciones empatadas en el primer puesto (vacio si no hay votos). */
function leaders(tallies: { optionId: string; count: number }[]): string[] {
  const max = Math.max(0, ...tallies.map((t) => t.count));
  if (max === 0) return [];
  return tallies.filter((t) => t.count === max).map((t) => t.optionId);
}
