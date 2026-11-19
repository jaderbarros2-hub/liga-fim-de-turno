import "server-only";
import { DIAS_SAQUE_AUTOMATICO, SAQUE_MINIMO } from "@/lib/carteira";
import { EMAIL_CONTATO, enviarEmail, SITE } from "@/lib/email";
import { dataLonga, hora, NOMES_FORMATO, reais } from "@/lib/formato";
import { enderecoLinha, IDENTIFICACAO, linkMapa } from "@/lib/lojas";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { mascararChave } from "@/lib/validacao";

/** Todos os e-mails do portal. Cada função busca o que precisa e nunca lança erro. */

const PRAZO_LOJA = "2 dias úteis";
const organizacao = () => process.env.EMAIL_ORGANIZACAO || EMAIL_CONTATO;
const nomeDe = (
  j: {
    nick_endstep?: string | null;
    nome?: string | null;
    discord_nome?: string | null;
  } | null,
) => j?.nick_endstep || j?.nome || j?.discord_nome || "jogador";

async function seguro(f: () => Promise<unknown>) {
  try {
    await f();
  } catch {
    /* e-mail nunca derruba o fluxo principal */
  }
}

export const emailBoasVindas = (jogadorId: string) =>
  seguro(async () => {
    const { data: j } = await criarClienteAdmin()
      .from("jogadores")
      .select("email, nick_endstep, nome")
      .eq("id", jogadorId)
      .maybeSingle();
    await enviarEmail({
      para: j?.email,
      tipo: "boas_vindas",
      jogadorId,
      assunto: "Bem-vindo à Liga Fim de Turno",
      conteudo: {
        titulo: `Bem-vindo, ${nomeDe(j)}`,
        previa: "Seu cadastro está pronto. Escolha a próxima etapa.",
        paragrafos: [
          "Seu cadastro na Liga Fim de Turno está completo.",
          "Escolha uma etapa na agenda, garanta o seu ingresso e jogue no Endstep. Cada etapa vale pontos no ranking do trimestre.",
          "Prêmios caem na sua **Carteira**: você saca por Pix, usa em ingressos ou resgata em lojas parceiras.",
        ],
        botao: { texto: "Ver a agenda", url: `${SITE}/eventos` },
      },
    });
  });

export const emailIngressoConfirmado = (inscricaoId: string) =>
  seguro(async () => {
    const db = criarClienteAdmin();
    const { data: i } = await db
      .from("inscricoes")
      .select(
        "id, deck_principal, jogador:jogadores(id, email, nick_endstep, nome), evento:eventos(slug, titulo, inicio, formato, modalidade, local, loja:parceiros(nome, logradouro, numero, complemento, bairro, cidade, uf, cep, mapa_url))",
      )
      .eq("id", inscricaoId)
      .maybeSingle();
    if (!i) return;
    const { data: pag } = await db
      .from("pagamentos")
      .select("valor_centavos, provedor")
      .eq("inscricao_id", inscricaoId)
      .eq("status", "aprovado")
      .order("pago_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    type L = {
      nome: string;
      logradouro: string | null;
      numero: string | null;
      complemento: string | null;
      bairro: string | null;
      cidade: string | null;
      uf: string | null;
      cep: string | null;
      mapa_url: string | null;
    };
    const j = i.jogador as unknown as {
      id: string;
      email: string | null;
      nick_endstep: string | null;
      nome: string | null;
    };
    const e = i.evento as unknown as {
      slug: string;
      titulo: string;
      inicio: string;
      formato: string;
      modalidade: string;
      local: string | null;
      loja: L | null;
    };
    const presencial = e.modalidade === "presencial";
    const semDeck =
      e.formato === "pauper" && !(i.deck_principal as unknown[] | null)?.length;
    await enviarEmail({
      para: j.email,
      tipo: "ingresso_confirmado",
      jogadorId: j.id,
      referencia: inscricaoId,
      assunto: `Ingresso confirmado · ${e.titulo}`,
      conteudo: {
        titulo: "Ingresso confirmado",
        previa: `${e.titulo} · ${dataLonga(e.inicio)} às ${hora(e.inicio)}`,
        paragrafos: [
          `Tudo certo, ${nomeDe(j)}. Sua vaga em **${e.titulo}** está garantida.`,
          presencial
            ? "O evento é presencial. Chegue com uns 15 minutos de antecedência."
            : "O link do torneio no Endstep fica na página do seu ingresso. Entre alguns minutos antes do horário.",
        ],
        detalhes: [
          ["Data", dataLonga(e.inicio)],
          ["Horário", hora(e.inicio)],
          ["Formato", NOMES_FORMATO[e.formato] ?? e.formato],
          [
            "Local",
            presencial
              ? e.loja
                ? `${e.loja.nome} · ${enderecoLinha(e.loja)}`
                : (e.local ?? "Presencial")
              : "Online · Endstep",
          ],
          ...(pag
            ? ([
                [
                  "Pago",
                  pag.provedor === "cupom"
                    ? "Cupom"
                    : `${reais(pag.valor_centavos)}${pag.provedor === "credito" ? " (Carteira)" : ""}`,
                ],
              ] as [string, string][])
            : []),
        ],
        aviso: semDeck
          ? "**Falta o seu deck.** No Pauper a lista é obrigatória: envie até 24 horas antes do evento, na página do ingresso."
          : "Precisa cancelar? Até 24 horas antes você escolhe reembolso por Pix ou crédito na Carteira.",
        botao:
          presencial && e.loja
            ? { texto: "Ver no mapa", url: linkMapa(e.loja) }
            : {
                texto: "Abrir meu ingresso",
                url: `${SITE}/eventos/${e.slug}/inscricao`,
              },
      },
    });
  });

export const emailIngressoCancelado = (
  inscricaoId: string,
  valor: number,
  destino: "pix" | "credito" | null,
) =>
  seguro(async () => {
    const { data: i } = await criarClienteAdmin()
      .from("inscricoes")
      .select(
        "jogador:jogadores(id, email, nick_endstep, nome), evento:eventos(titulo)",
      )
      .eq("id", inscricaoId)
      .maybeSingle();
    const j = i?.jogador as unknown as
      | {
          id: string;
          email: string | null;
          nick_endstep: string | null;
          nome: string | null;
        }
      | undefined;
    const e = i?.evento as unknown as { titulo: string } | undefined;
    if (!j || !e) return;
    await enviarEmail({
      para: j.email,
      tipo: "ingresso_cancelado",
      jogadorId: j.id,
      referencia: inscricaoId,
      assunto: `Ingresso cancelado · ${e.titulo}`,
      conteudo: {
        titulo: "Ingresso cancelado",
        paragrafos: [
          `Cancelamos o seu ingresso de **${e.titulo}**.`,
          !valor
            ? "Não havia valor a devolver."
            : destino === "credito"
              ? `${reais(valor)} voltaram para a sua Carteira e já podem ser usados no próximo ingresso.`
              : `O reembolso de ${reais(valor)} vai para a sua chave Pix em até 48 horas.`,
        ],
        botao: { texto: "Ver a agenda", url: `${SITE}/eventos` },
      },
    });
  });

export const emailPremio = (
  jogadorId: string,
  valor: number,
  posicao: number | null,
  evento: { titulo: string; slug: string },
) =>
  seguro(async () => {
    const { data: j } = await criarClienteAdmin()
      .from("jogadores")
      .select("email, nick_endstep, nome")
      .eq("id", jogadorId)
      .maybeSingle();
    await enviarEmail({
      para: j?.email,
      tipo: "premio",
      jogadorId,
      assunto: `Seu prêmio de ${reais(valor)} chegou · ${evento.titulo}`,
      conteudo: {
        titulo: posicao === 1 ? "Você é campeão!" : "Seu prêmio chegou",
        previa: `${reais(valor)} na sua Carteira`,
        paragrafos: [
          `Parabéns, ${nomeDe(j)}! ${posicao ? `Você ficou em **${posicao}º lugar** em` : "Você premiou em"} **${evento.titulo}**.`,
          `**${reais(valor)}** já estão na sua Carteira. Você escolhe o que fazer: sacar por Pix (a partir de ${reais(SAQUE_MINIMO)}), pagar o próximo ingresso ou resgatar em uma loja parceira.`,
        ],
        aviso: `Saldo parado há ${DIAS_SAQUE_AUTOMATICO} dias é depositado automaticamente na sua chave Pix.`,
        botao: {
          texto: "Abrir minha Carteira",
          url: `${SITE}/minha-area?aba=carteira`,
        },
      },
    });
  });

type Mov = {
  id: string;
  tipo: string;
  valor_centavos: number;
  credito_centavos: number | null;
  conta_loja: string | null;
  codigo_loja: string | null;
  chave_pix: string | null;
  automatico: boolean;
  descricao: string | null;
  jogador: {
    id: string;
    email: string | null;
    nick_endstep: string | null;
    nome: string | null;
    telefone?: string | null;
  } | null;
  parceiro: { id: string; nome: string; bonus_credito_pct: number } | null;
};
async function movimento(id: string) {
  const { data } = await criarClienteAdmin()
    .from("carteira_movimentos")
    .select(
      "id, tipo, valor_centavos, credito_centavos, conta_loja, codigo_loja, chave_pix, automatico, descricao, jogador:jogadores(id, email, nick_endstep, nome), parceiro:parceiros(id, nome, bonus_credito_pct)",
    )
    .eq("id", id)
    .maybeSingle();
  return data as unknown as Mov | null;
}

export const emailSaqueSolicitado = (movId: string) =>
  seguro(async () => {
    const m = await movimento(movId);
    if (!m?.jogador) return;
    const valor = Math.abs(m.valor_centavos);
    await enviarEmail({
      para: m.jogador.email,
      tipo: "saque_solicitado",
      jogadorId: m.jogador.id,
      referencia: movId,
      assunto: m.automatico
        ? `Saque automático de ${reais(valor)}`
        : `Saque de ${reais(valor)} solicitado`,
      conteudo: {
        titulo: m.automatico
          ? "Saque automático a caminho"
          : "Saque solicitado",
        paragrafos: [
          m.automatico
            ? `O saldo da sua Carteira ficou parado por ${DIAS_SAQUE_AUTOMATICO} dias, então vamos depositar **${reais(valor)}** na sua chave Pix.`
            : `Recebemos o seu pedido de saque de **${reais(valor)}**.`,
          "O Pix cai em até 48 horas. Avisamos por e-mail quando for feito.",
        ],
        detalhes: [
          ["Valor", reais(valor)],
          ["Chave Pix", mascararChave(m.chave_pix) || "—"],
        ],
        botao: {
          texto: "Abrir minha Carteira",
          url: `${SITE}/minha-area?aba=carteira`,
        },
      },
    });
    await avisarOrganizacao(
      `Saque pendente: ${reais(valor)} · ${nomeDe(m.jogador)}`,
      "Novo saque para pagar",
      "Há um saque esperando o Pix no Financeiro.",
      [
        ["Jogador", nomeDe(m.jogador)],
        ["Valor", reais(valor)],
        ["Tipo", m.automatico ? "Automático (30 dias)" : "Pedido pelo jogador"],
      ],
    );
  });

export const emailSaquePago = (movId: string) =>
  seguro(async () => {
    const m = await movimento(movId);
    if (!m?.jogador) return;
    const valor = Math.abs(m.valor_centavos);
    await enviarEmail({
      para: m.jogador.email,
      tipo: "saque_pago",
      jogadorId: m.jogador.id,
      referencia: movId,
      assunto: `Pix de ${reais(valor)} enviado`,
      conteudo: {
        titulo: "Pix enviado",
        paragrafos: [
          `Fizemos o Pix de **${reais(valor)}** para a sua chave. Confira no app do seu banco.`,
        ],
        detalhes: [
          ["Valor", reais(valor)],
          ["Chave Pix", mascararChave(m.chave_pix) || "—"],
        ],
        botao: {
          texto: "Ver o histórico",
          url: `${SITE}/minha-area?aba=carteira`,
        },
      },
    });
  });

/** Jogador pediu crédito numa loja: confirmação com o código e o prazo. */
export const emailResgateSolicitado = (movId: string) =>
  seguro(async () => {
    const m = await movimento(movId);
    if (!m?.jogador || !m.parceiro) return;
    const { data: cred } = await criarClienteAdmin()
      .from("lojas_credito")
      .select("url_cadastro, identificacao")
      .eq("parceiro_id", m.parceiro.id)
      .maybeSingle();
    const valor = Math.abs(m.valor_centavos);
    const credito = m.credito_centavos ?? valor;
    await enviarEmail({
      para: m.jogador.email,
      tipo: "resgate_solicitado",
      jogadorId: m.jogador.id,
      referencia: movId,
      assunto: `Seu crédito na ${m.parceiro.nome} foi solicitado`,
      conteudo: {
        titulo: "Crédito solicitado",
        previa: `${reais(credito)} na ${m.parceiro.nome} em até ${PRAZO_LOJA}`,
        paragrafos: [
          `Seu crédito na **${m.parceiro.nome}** foi solicitado. Em até **${PRAZO_LOJA}** ele estará disponível na sua conta da loja.`,
          "Use o código abaixo se a loja pedir alguma confirmação na hora da compra.",
        ],
        codigo: m.codigo_loja
          ? { rotulo: "Código do crédito", valor: m.codigo_loja }
          : undefined,
        detalhes: [
          ["Saiu da Carteira", reais(valor)],
          [
            "Crédito na loja",
            `${reais(credito)}${credito > valor ? ` (+${m.parceiro.bonus_credito_pct}% de bônus)` : ""}`,
          ],
          [
            IDENTIFICACAO[cred?.identificacao ?? "email"]
              .replace(" da sua conta", "")
              .replace(" cadastrado", ""),
            m.conta_loja ?? "—",
          ],
        ],
        aviso: `Para usar o crédito você precisa ter **cadastro e login na ${m.parceiro.nome}**${cred?.url_cadastro ? ` (${cred.url_cadastro})` : ""}. Depois de liberado, o crédito é da loja e segue as regras dela.`,
        botao: {
          texto: "Ver minha Carteira",
          url: `${SITE}/minha-area?aba=carteira`,
        },
      },
    });
    await avisarOrganizacao(
      `Resgate em loja: ${reais(valor)} · ${m.parceiro.nome}`,
      "Novo resgate em loja",
      "Faça o Pix para a loja e confirme no Financeiro em até 1 dia útil: o jogador foi avisado de 2 dias úteis.",
      [
        ["Jogador", nomeDe(m.jogador)],
        ["Loja", m.parceiro.nome],
        ["Pix para a loja", reais(valor)],
        ["Crédito a gerar", reais(credito)],
        ["Código", m.codigo_loja ?? "—"],
      ],
    );
  });

/** Pix enviado à loja: pedido para a loja gerar o crédito. */
export const emailResgateParaLoja = (movId: string) =>
  seguro(async () => {
    const m = await movimento(movId);
    if (!m?.jogador || !m.parceiro) return;
    const { data: cred } = await criarClienteAdmin()
      .from("lojas_credito")
      .select("email_pedidos, identificacao, pix_chave")
      .eq("parceiro_id", m.parceiro.id)
      .maybeSingle();
    const valor = Math.abs(m.valor_centavos);
    const credito = m.credito_centavos ?? valor;
    await enviarEmail({
      para: cred?.email_pedidos,
      tipo: "resgate_loja",
      referencia: movId,
      assunto: `Liga Fim de Turno · gerar crédito de ${reais(credito)} (${m.codigo_loja ?? ""})`,
      conteudo: {
        titulo: "Novo crédito para gerar",
        previa: `Pix de ${reais(valor)} enviado. Gerar ${reais(credito)} para ${m.conta_loja ?? ""}`,
        paragrafos: [
          `Olá, equipe da **${m.parceiro.nome}**! Enviamos um Pix de **${reais(valor)}** para a chave cadastrada da loja.`,
          `Por favor, gere **${reais(credito)}** de crédito na conta do cliente abaixo em até **${PRAZO_LOJA}**.`,
        ],
        detalhes: [
          ["Cliente", m.jogador.nome || nomeDe(m.jogador)],
          [
            IDENTIFICACAO[cred?.identificacao ?? "email"].replace(
              "sua conta",
              "conta",
            ),
            m.conta_loja ?? "—",
          ],
          ["E-mail do cliente", m.jogador.email ?? "—"],
          ["Pix enviado", reais(valor)],
          [
            "Crédito a gerar",
            `${reais(credito)}${credito > valor ? ` (inclui ${m.parceiro.bonus_credito_pct}% de bônus da parceria)` : ""}`,
          ],
        ],
        codigo: m.codigo_loja
          ? { rotulo: "Código do pedido", valor: m.codigo_loja }
          : undefined,
        aviso:
          "O cliente já foi avisado do prazo. Qualquer problema com a conta dele, responda este e-mail.",
      },
    });
  });

async function avisarOrganizacao(
  assunto: string,
  titulo: string,
  texto: string,
  detalhes?: [string, string][],
) {
  const para = organizacao();
  if (!para) return;
  await enviarEmail({
    para,
    tipo: "organizacao",
    assunto,
    conteudo: {
      titulo,
      paragrafos: [texto],
      detalhes,
      botao: { texto: "Abrir o Financeiro", url: `${SITE}/painel/financeiro` },
    },
  });
}

/** E-mail de teste do Painel. */
export const emailTeste = (para: string) =>
  enviarEmail({
    para,
    tipo: "teste",
    assunto: "Teste de e-mail · Liga Fim de Turno",
    conteudo: {
      titulo: "Tudo certo por aqui",
      paragrafos: [
        "Se você recebeu este e-mail, o envio do portal está funcionando.",
        "Os próximos e-mails seguem este mesmo visual.",
      ],
      detalhes: [
        [
          "Enviado em",
          new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
        ],
        ["Remetente", process.env.EMAIL_REMETENTE || "onboarding@resend.dev"],
      ],
      codigo: { rotulo: "Código de exemplo", valor: "FDT-7K2Q" },
      botao: { texto: "Abrir o portal", url: SITE },
    },
  });
