import { BotaoLink } from "@/components/Botao";

export default function NaoEncontrado() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-5 px-6 py-20">
      <h1 className="titulo text-5xl">Página não encontrada</h1>
      <p className="text-texto2">
        O endereço pode ter mudado ou o evento não existe mais.
      </p>
      <BotaoLink href="/eventos">Ver agenda</BotaoLink>
    </div>
  );
}
