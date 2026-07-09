"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { addAdmin, type AddAdminState } from "./actions";

const initialState: AddAdminState = { ok: false };
const inputClass = "h-11 w-full rounded-md border border-zinc-300 px-3 text-base";

export default function AddAdminForm() {
  const [state, formAction, isPending] = useActionState(addAdmin, initialState);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4"
    >
      <div className="min-w-[160px] flex-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="name">Nombre</label>
        <input id="name" name="name" required className={inputClass} />
      </div>
      <div className="min-w-[200px] flex-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Agregando..." : "+ Agregar"}
      </button>
      {state.error && (
        <p className="w-full text-sm text-red-600" role="alert">{state.error}</p>
      )}
    </form>
  );
}
