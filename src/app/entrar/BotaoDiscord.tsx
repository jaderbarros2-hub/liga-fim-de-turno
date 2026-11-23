"use client";

import { useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/client";

export function BotaoDiscord({ destino }: { destino: string }) {
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setCarregando(true);
    const supabase = criarClienteNavegador();
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?voltar=${encodeURIComponent(destino)}`,
        scopes: "identify email",
      },
    });
  }

  return (
    <button
      type="button"
      onClick={entrar}
      disabled={carregando}
      className="corte group inline-flex min-h-14 w-full items-center justify-center gap-3 bg-[#5865F2] px-6 text-base font-semibold uppercase tracking-wide text-white transition hover:bg-[#4752c4] disabled:opacity-60"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M20.3 4.4A19.7 19.7 0 0 0 15.4 3l-.6 1.3a18.3 18.3 0 0 0-5.6 0L8.6 3a19.6 19.6 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18.1A19.8 19.8 0 0 0 6.2 21l1.3-2a12.9 12.9 0 0 1-2-1l.5-.4a14.1 14.1 0 0 0 12 0l.5.4c-.6.4-1.3.7-2 1l1.3 2a19.7 19.7 0 0 0 6.1-2.9c.5-5.2-.8-9.7-3.6-13.7ZM8.3 15.3c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm7.4 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z" />
      </svg>
      {carregando ? "Abrindo o Discord…" : "Entrar com Discord"}
    </button>
  );
}
