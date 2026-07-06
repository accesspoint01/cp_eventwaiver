"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

const initialState: LoginState = { ok: false };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(sendMagicLink, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-zinc-900">
          Panel de administración — Center Point
        </h1>

        {state.sent ? (
          <p className="text-sm text-green-700">
            Te enviamos un link de acceso a tu email. Ábrelo desde este mismo
            dispositivo para entrar.
          </p>
        ) : (
          <form action={formAction} className="space-y-3">
            <input
              type="email"
              name="email"
              required
              placeholder="tu-email@accesspointpr.com"
              autoComplete="email"
              className="h-11 w-full rounded-md border border-zinc-300 px-3 text-base focus:border-zinc-500 focus:outline-none"
            />
            {state.error && (
              <p className="text-sm text-red-600" role="alert">{state.error}</p>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="h-11 w-full rounded-md bg-zinc-900 font-medium text-white disabled:opacity-60"
            >
              {isPending ? "Enviando..." : "Enviar link de acceso"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
