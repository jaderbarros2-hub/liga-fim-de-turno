import type { Metadata } from "next";
import { PaginaTexto } from "@/components/PaginaTexto";

export const metadata: Metadata = { title: "Perguntas frequentes" };

const PERGUNTAS = [
  {
    p: "Preciso ter as cartas para jogar?",
    r: "Não. Os eventos online acontecem no Endstep, que tem todas as cartas liberadas de graça.",
  },
  {
    p: "Como pago a inscrição?",
    r: "Por Pix, direto no portal. A inscrição é confirmada automaticamente quando o pagamento cai.",
  },
  {
    p: "Posso cancelar?",
    r: "Sim, até 24 horas antes do início, com reembolso ou crédito para outro evento. Depois disso não há reembolso, a não ser que a organização cancele o evento.",
  },
  {
    p: "E se o evento não atingir o mínimo de jogadores?",
    r: "Com menos de 8 inscritos o evento é cancelado e cada inscrito escolhe reembolso ou crédito.",
  },
  {
    p: "Como recebo o prêmio?",
    r: "Por Pix, em até 48 horas, na chave cadastrada no seu perfil. A chave precisa estar no seu nome (ou do responsável, se você for menor de idade).",
  },
  {
    p: "Onde tiro dúvidas no dia do evento?",
    r: "No canal do evento no Discord da liga.",
  },
];

export default function Perguntas() {
  return (
    <PaginaTexto titulo="Perguntas frequentes">
      {PERGUNTAS.map((q) => (
        <div key={q.p}>
          <h3>{q.p}</h3>
          <p>{q.r}</p>
        </div>
      ))}
    </PaginaTexto>
  );
}
