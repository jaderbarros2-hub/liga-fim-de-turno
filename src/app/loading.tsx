import { Carregando } from "@/components/BotaoEnviar";

/** Aparece na hora em que um link é clicado, enquanto a próxima página carrega. */
export default function CarregandoPagina() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-cinza"
    >
      <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-transparent">
        <div className="h-full w-1/3 animate-[carregando_1s_ease-in-out_infinite] bg-brasa" />
      </div>
      <Carregando className="h-6 w-6 text-brasa" />
      <span className="text-sm">Carregando…</span>
    </div>
  );
}
