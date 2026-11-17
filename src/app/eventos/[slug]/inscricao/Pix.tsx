"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** QR Code, copia e cola, contagem regressiva e consulta automática da confirmação. */
export function Pix({
  pagamentoId,
  copiaCola,
  qrBase64,
  expiraEm,
}: {
  pagamentoId: string;
  copiaCola: string;
  qrBase64: string | null;
  expiraEm: string | null;
}) {
  const router = useRouter();
  const [copiado, setCopiado] = useState(false);
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const relogio = setInterval(() => setAgora(Date.now()), 1000);
    let parar = false;
    const consultar = async () => {
      if (parar) return;
      try {
        const r = await fetch(`/api/pagamentos/${pagamentoId}`, { cache: "no-store" });
        if (r.ok) {
          const { status } = (await r.json()) as { status: string };
          if (status !== "pendente") {
            parar = true;
            router.refresh();
            return;
          }
        }
      } catch {
        // rede instável: tenta de novo no próximo ciclo
      }
      setTimeout(consultar, 5000);
    };
    const inicio = setTimeout(consultar, 4000);
    return () => {
      parar = true;
      clearInterval(relogio);
      clearTimeout(inicio);
    };
  }, [pagamentoId, router]);

  const restante = expiraEm ? Math.max(0, new Date(expiraEm).getTime() - agora) : null;
  const mm = restante !== null ? String(Math.floor(restante / 60000)).padStart(2, "0") : null;
  const ss = restante !== null ? String(Math.floor((restante % 60000) / 1000)).padStart(2, "0") : null;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(copiaCola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-azul bg-grafite p-6 sm:flex-row sm:items-start">
      {qrBase64 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`data:image/png;base64,${qrBase64}`}
          alt="QR Code do Pix"
          width={220}
          height={220}
          className="self-center rounded-lg bg-white p-2"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className="font-semibold">Pague com o app do seu banco</p>
        <p className="text-sm text-texto2">
          Escaneie o QR Code ou use o Pix copia e cola. A confirmação aparece aqui sozinha em poucos segundos.
        </p>
        <div className="break-all rounded-lg border border-borda bg-preto p-3 font-mono text-xs text-texto2">
          {copiaCola}
        </div>
        <button
          type="button"
          onClick={copiar}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-azul px-5 text-sm font-semibold uppercase tracking-wide text-white hover:bg-azul-escuro"
        >
          {copiado ? "Copiado ✓" : "Copiar código Pix"}
        </button>
        <p className="flex items-center gap-2 text-sm text-cinza" aria-live="polite">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-ciano" />
          Aguardando pagamento{mm !== null && ` · expira em ${mm}:${ss}`}
        </p>
      </div>
    </div>
  );
}
