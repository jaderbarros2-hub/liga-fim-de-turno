"use client";

import { useState } from "react";

/** Botões de compartilhar: WhatsApp, X, Facebook e copiar link. */
export function Compartilhar({ titulo, caminho }: { titulo: string; caminho: string }) {
  const [copiado, setCopiado] = useState(false);
  const url = () => `${window.location.origin}${caminho}`;
  const abrir = (destino: string) => window.open(destino, "_blank", "noopener,width=640,height=560");
  const botao = "grid h-8 w-8 place-items-center rounded-full text-cinza ring-1 ring-borda hover:text-gelo hover:ring-ciano";

  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label="Compartilhar no WhatsApp" className={botao} onClick={() => abrir(`https://wa.me/?text=${encodeURIComponent(`${titulo} ${url()}`)}`)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3Z" /></svg>
      </button>
      <button type="button" aria-label="Compartilhar no X" className={botao} onClick={() => abrir(`https://x.com/intent/post?text=${encodeURIComponent(titulo)}&url=${encodeURIComponent(url())}`)}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.2 2h3.4l-7.4 8.5L23 22h-6.8l-5.3-7-6.1 7H1.4l7.9-9.1L1 2h7l4.8 6.4L18.2 2Zm-1.2 18h1.9L7.1 3.9H5.1L17 20Z" /></svg>
      </button>
      <button type="button" aria-label="Compartilhar no Facebook" className={botao} onClick={() => abrir(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8V6c0-.9.6-1 1-1h3V1h-4c-4 0-5 3-5 5v2H6v4h3v11h5V12h3.5l.5-4h-4Z" /></svg>
      </button>
      <button
        type="button"
        className="flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-cinza ring-1 ring-borda hover:text-gelo hover:ring-ciano"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url());
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
          } catch {}
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
        {copiado ? "Link copiado" : "Copiar link"}
      </button>
    </div>
  );
}
