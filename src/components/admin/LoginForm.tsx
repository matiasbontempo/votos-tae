"use client";

import { useActionState } from "react";

import { loginAction, type ActionResult } from "@/lib/actions";

const initial: ActionResult = {};

export function LoginForm() {
  const [result, formAction, pending] = useActionState(loginAction, initial);

  return (
    <main className="stage-bg flex min-h-screen-safe items-center justify-center px-6">
      <form action={formAction} className="w-full max-w-xs">
        <p className="text-brass text-center text-[11px] font-semibold tracking-[0.25em] uppercase">
          Backstage
        </p>
        <h1 className="font-display mt-2 mb-6 text-center text-2xl">
          Panel de función
        </h1>

        <input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Contraseña"
          autoFocus
          className="focus:border-brass w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-center text-base outline-none"
        />

        {result.error && (
          <p role="alert" className="mt-3 text-center text-sm text-red-300">
            {result.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-brass text-ink mt-4 h-12 w-full rounded-xl text-sm font-semibold disabled:opacity-60"
        >
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
