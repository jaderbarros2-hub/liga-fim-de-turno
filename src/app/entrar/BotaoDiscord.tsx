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
      className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-[#5865F2] px-6 font-semibold text-white disabled:opacity-60"
    >
      {carregando ? "Abrindo o Discord…" : "Entrar com Discord"}
    </button>
  );
}
