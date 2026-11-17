import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BotaoLink } from "@/components/Botao";
import { buscarEvento, usuarioAtual } from "@/lib/dados";
import { dataLonga, hora, reais } from "@/lib/formato";

export const metadata: Metadata = { title: "Inscrição" };
export const dynamic = "force-dynamic";

// Bloco 2: aqui entra a geração do Pix pelo Mercado Pago e a confirmação automática.
export default async function Inscricao({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const evento = await buscarEvento(slug);
  if (!evento) notFound();

  const jogador = await usuarioAtual();
  if (!jogador) redirect(`/entrar?voltar=${encodeURIComponent(`/eventos/${slug}/inscricao`)}`);
  if (!jogador.aceite_termos_em) redirect(`/cadastro?voltar=${encodeURIComponent(`/eventos/${slug}/inscricao`)}`);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <ol aria-label="Etapas da inscrição" className="flex flex-wrap gap-3 text-sm font-semibold">
        <li className="rounded-full border border-borda-forte px-4 py-2 text-cinza">1 · Cadastro ✓</li>
        <li className="rounded-full bg-azul px-4 py-2 text-white">2 · Pagamento</li>
        <li className="rounded-full border border-borda-forte px-4 py-2 text-cinza">3 · Confirmado</li>
      </ol>
      <h1 className="titulo text-5xl">{evento.titulo}</h1>
      <p className="text-texto2">
        {dataLonga(evento.inicio)}, {hora(evento.inicio)} · Inscrição de {reais(evento.valor_centavos)}
      </p>
      <div className="rounded-xl border border-alerta bg-grafite p-6 text-texto2">
        O pagamento por Pix com confirmação automática está sendo ligado ao Mercado Pago. Por enquanto, fale com
        a organização no Discord para garantir sua vaga.
      </div>
      <BotaoLink href={`/eventos/${slug}`} variante="contorno" className="self-start">
        Voltar ao evento
      </BotaoLink>
    </div>
  );
}
