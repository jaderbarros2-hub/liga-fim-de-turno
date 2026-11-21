import "server-only";
import { ehConstruido } from "@/lib/formatos";
import { DIAS_SAQUE_AUTOMATICO, SAQUE_MINIMO } from "@/lib/carteira";
import {
  EMAIL_CONTATO,
  enviarEmail,
  imagemDoEvento,
  imagemFixa,
  SITE,
} from "@/lib/email";
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
      assunto: `Bem-vindo à Liga Fim de Turno, ${nomeDe(j)}`,
      conteudo: {
        imagem: imagemFixa("boas-vindas"),
        titulo: `Bem-vindo à liga, ${nomeDe(j)}`,
        previa: "Seu cadastro está pronto. Escolha a próxima etapa.",
        paragrafos: [
          "Seu cadastro está completo. Escolha uma etapa na agenda, garanta o ingresso e jogue: cada etapa vale pontos no ranking do trimestre.",
          "Os prêmios caem na sua **Carteira**, para sacar por Pix, pagar ingressos ou resgatar em lojas parceiras.",
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
        "id, deck_principal, jogador:jogadores(id, email, nick_endstep, nome), evento:eventos(id, slug, titulo, inicio, formato, modalidade, local, liga:ligas(slug), colecao_info:colecoes(arte_url, arte_credito), cubo_info:cubos(imagem_url, imagem_credito), loja:parceiros(nome, logradouro, numero, complemento, bairro, cidade, uf, cep, mapa_url))",
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
    const e = i.evento as unknown as Parameters<typeof imagemDoEvento>[0] & {
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
      ehConstruido(e.formato) &&
      !(i.deck_principal as unknown[] | null)?.length;
    await enviarEmail({
      para: j.email,
      tipo: "ingresso_confirmado",
      jogadorId: j.id,
      referencia: inscricaoId,
      assunto: `Ingresso confirmado: ${e.titulo}`,
      conteudo: {
        imagem: imagemDoEvento(e),
        selo: { texto: "Ingresso confirmado" },
        titulo: e.titulo,
        previa: `${dataLonga(e.inicio)} às ${hora(e.inicio)}. Sua vaga está garantida.`,
        paragrafos: [
          `Tudo certo, ${nomeDe(j)}: sua vaga está garantida. ${
            presencial
              ? "Chegue 15 minutos antes para o check-in na loja."
              : "O link do torneio no Endstep fica na página do seu ingresso."
          }`,
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
        "jogador:jogadores(id, email, nick_endstep, nome), evento:eventos(id, titulo, formato, liga:ligas(slug), colecao_info:colecoes(arte_url, arte_credito), cubo_info:cubos(imagem_url, imagem_credito))",
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
    const e = i?.evento as unknown as
      (Parameters<typeof imagemDoEvento>[0] & { titulo: string }) | undefined;
    if (!j || !e) return;
    await enviarEmail({
      para: j.email,
      tipo: "ingresso_cancelado",
      jogadorId: j.id,
      referencia: inscricaoId,
      assunto: `Ingresso cancelado: ${e.titulo}`,
      conteudo: {
        imagem: imagemDoEvento(e),
        selo: { texto: "Ingresso cancelado", tom: "erro" },
        titulo: e.titulo,
        destaque: valor
          ? {
              valor: reais(valor),
              rotulo:
                destino === "credito"
                  ? "de volta na sua Carteira"
                  : "de reembolso por Pix, em até 48 horas",
            }
          : undefined,
        paragrafos: [
          !valor
            ? "Não havia valor a devolver."
            : destino === "credito"
              ? "O valor já está na sua Carteira e pode pagar o próximo ingresso."
              : "O reembolso vai para a sua chave Pix cadastrada.",
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
    const db = criarClienteAdmin();
    const [{ data: j }, { data: ev }] = await Promise.all([
      db
        .from("jogadores")
        .select("email, nick_endstep, nome")
        .eq("id", jogadorId)
        .maybeSingle(),
      db
        .from("eventos")
        .select(
          "id, formato, liga:ligas(slug), colecao_info:colecoes(arte_url, arte_credito), cubo_info:cubos(imagem_url, imagem_credito)",
        )
        .eq("slug", evento.slug)
        .maybeSingle(),
    ]);
    await enviarEmail({
      para: j?.email,
      tipo: "premio",
      jogadorId,
      assunto:
        posicao === 1
          ? `Você venceu ${evento.titulo}: ${reais(valor)} na Carteira`
          : `Prêmio de ${reais(valor)} em ${evento.titulo}`,
      conteudo: {
        imagem: ev
          ? imagemDoEvento(
              ev as unknown as Parameters<typeof imagemDoEvento>[0],
            )
          : imagemFixa("premio"),
        selo: { texto: posicao ? `${posicao}º lugar` : "Premiado" },
        titulo:
          posicao === 1
            ? `Parabéns, ${nomeDe(j)}: você é campeão!`
            : `Parabéns, ${nomeDe(j)}!`,
        previa: `${reais(valor)} já estão na sua Carteira.`,
        destaque: { valor: reais(valor), rotulo: "já estão na sua Carteira" },
        paragrafos: [
          `Seu prêmio de **${evento.titulo}** chegou. Saque por Pix (a partir de ${reais(SAQUE_MINIMO)}), pague o próximo ingresso ou resgate em uma loja parceira.`,
        ],
        aviso: `Saldo parado há ${DIAS_SAQUE_AUTOMATICO} dias é depositado automaticamente na sua chave Pix.`,
        botao: {
          texto: "Abrir minha Carteira",
          url: `${SITE}/minha-area?aba=carteira`,
        },
      },
    });
  });

/** Prêmio extra de parceiro (cupom, booster, brinde) entregue ao jogador. */
export const emailPremioParceiro = (premioId: string) =>
  seguro(async () => {
    const { data: p } = await criarClienteAdmin()
      .from("premios_parceiros")
      .select(
        "id, tipo, descricao, codigo, validade, criterio, posicao, jogador:jogadores(id, email, nick_endstep, nome), parceiro:parceiros(nome, slug, foto_url), evento:eventos(titulo, slug)",
      )
      .eq("id", premioId)
      .maybeSingle();
    const premio = p as unknown as {
      tipo: string;
      descricao: string;
      codigo: string | null;
      validade: string | null;
      criterio: string;
      posicao: number | null;
      jogador: {
        id: string;
        email: string | null;
        nick_endstep: string | null;
        nome: string | null;
      } | null;
      parceiro: {
        nome: string;
        slug: string | null;
        foto_url: string | null;
      } | null;
      evento: { titulo: string; slug: string } | null;
    } | null;
    if (!premio?.jogador) return;
    const loja = premio.parceiro?.nome ?? "uma loja parceira";
    const sorteio = premio.criterio === "sorteio";
    await enviarEmail({
      para: premio.jogador.email,
      tipo: "premio_parceiro",
      jogadorId: premio.jogador.id,
      assunto: `${sorteio ? "Você foi sorteado" : "Prêmio extra"}: ${premio.descricao}`,
      conteudo: {
        imagem: premio.parceiro?.foto_url
          ? { url: premio.parceiro.foto_url, credito: loja }
          : imagemFixa(`parceiro-${premioId}`),
        selo: { texto: sorteio ? "Sorteio" : `${premio.posicao ?? 1}º lugar` },
        titulo: sorteio
          ? `${nomeDe(premio.jogador)}, você foi sorteado!`
          : `Parabéns, ${nomeDe(premio.jogador)}!`,
        previa: `${premio.descricao}, oferecido por ${loja}.`,
        paragrafos: [
          `Em **${premio.evento?.titulo ?? "um evento da liga"}** você ganhou **${premio.descricao}**, oferecido por **${loja}**, parceira da liga.`,
          premio.codigo
            ? "Use o código abaixo na loja. Ele também fica guardado na sua Carteira."
            : "A organização vai combinar a entrega com você pelo Discord ou por e-mail.",
        ],
        codigo: premio.codigo
          ? { rotulo: "Código do cupom", valor: premio.codigo }
          : undefined,
        aviso: premio.validade
          ? `Válido até ${new Date(`${premio.validade}T12:00:00Z`).toLocaleDateString("pt-BR")}.`
          : undefined,
        botao: {
          texto: "Ver na minha Carteira",
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
  parceiro: {
    id: string;
    nome: string;
    bonus_credito_pct: number;
    foto_url: string | null;
  } | null;
};
async function movimento(id: string) {
  const { data } = await criarClienteAdmin()
    .from("carteira_movimentos")
    .select(
      "id, tipo, valor_centavos, credito_centavos, conta_loja, codigo_loja, chave_pix, automatico, descricao, jogador:jogadores(id, email, nick_endstep, nome), parceiro:parceiros(id, nome, bonus_credito_pct, foto_url)",
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
        ? `Saque automático de ${reais(valor)} a caminho`
        : `Saque de ${reais(valor)} solicitado`,
      conteudo: {
        imagem: imagemFixa(`saque-${movId}`),
        selo: {
          texto: m.automatico ? "Saque automático" : "Saque solicitado",
          tom: "alerta",
        },
        titulo: "Seu saque está a caminho",
        destaque: { valor: reais(valor), rotulo: "por Pix, em até 48 horas" },
        paragrafos: [
          m.automatico
            ? `O saldo da sua Carteira ficou parado por ${DIAS_SAQUE_AUTOMATICO} dias, então vamos depositar o valor na sua chave Pix. Avisamos quando o Pix for feito.`
            : "Recebemos o seu pedido. Avisamos por e-mail quando o Pix for feito.",
        ],
        detalhes: [["Chave Pix", mascararChave(m.chave_pix) || "—"]],
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
      assunto: `Pix de ${reais(valor)} enviado para você`,
      conteudo: {
        imagem: imagemFixa(`pix-${movId}`),
        selo: { texto: "Pago" },
        titulo: "Seu Pix foi enviado",
        destaque: {
          valor: reais(valor),
          rotulo: "enviados para a sua chave Pix",
        },
        paragrafos: ["Confira no app do seu banco."],
        detalhes: [["Chave Pix", mascararChave(m.chave_pix) || "—"]],
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
      assunto: `Crédito de ${reais(credito)} na ${m.parceiro.nome} solicitado`,
      conteudo: {
        imagem: m.parceiro.foto_url
          ? { url: m.parceiro.foto_url }
          : imagemFixa(`loja-${m.parceiro.id}`),
        selo: { texto: `Em até ${PRAZO_LOJA}`, tom: "alerta" },
        titulo: `Seu crédito na ${m.parceiro.nome} está a caminho`,
        previa: `${reais(credito)} na sua conta da loja em até ${PRAZO_LOJA}.`,
        destaque: {
          valor: reais(credito),
          rotulo: `de crédito na ${m.parceiro.nome}`,
        },
        paragrafos: [
          "O crédito aparece na sua conta da loja em até 2 dias úteis. Guarde o código: a loja pode pedir na hora da compra.",
        ],
        codigo: m.codigo_loja
          ? { rotulo: "Código do crédito", valor: m.codigo_loja }
          : undefined,
        detalhes: [
          ["Saiu da Carteira", reais(valor)],
          ...(credito > valor
            ? ([
                [
                  "Bônus da loja",
                  `+${m.parceiro.bonus_credito_pct}% (${reais(credito - valor)})`,
                ],
              ] as [string, string][])
            : []),
          [
            IDENTIFICACAO[cred?.identificacao ?? "email"]
              .replace(" da sua conta", "")
              .replace(" cadastrado", ""),
            m.conta_loja ?? "—",
          ],
        ],
        aviso: `Para usar o crédito você precisa ter **cadastro e login na ${m.parceiro.nome}**${cred?.url_cadastro ? ` (${cred.url_cadastro})` : ""}. Depois de liberado, ele segue as regras da loja.`,
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
      assunto: `Novo crédito para gerar: ${reais(credito)} · pedido ${m.codigo_loja ?? ""}`,
      conteudo: {
        imagem: m.parceiro.foto_url
          ? { url: m.parceiro.foto_url }
          : imagemFixa(`loja-${m.parceiro.id}`),
        motivo: `Você recebe este e-mail porque a ${m.parceiro.nome} é loja parceira da Liga Fim de Turno`,
        selo: { texto: `Gerar em até ${PRAZO_LOJA}`, tom: "alerta" },
        titulo: "Gere o crédito deste cliente",
        destaque: {
          valor: reais(credito),
          rotulo: "de crédito para gerar na conta do cliente",
        },
        previa: `Pix de ${reais(valor)} enviado. Gerar ${reais(credito)} para ${m.conta_loja ?? ""}`,
        paragrafos: [
          `Olá, equipe da **${m.parceiro.nome}**! Enviamos um Pix de **${reais(valor)}** para a chave da loja. Por favor, gere o crédito na conta abaixo em até **${PRAZO_LOJA}**.`,
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
          ["Pix enviado à loja", reais(valor)],
          ...(credito > valor
            ? ([
                [
                  "Bônus da parceria",
                  `+${m.parceiro.bonus_credito_pct}% (${reais(credito - valor)})`,
                ],
              ] as [string, string][])
            : []),
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
    assunto: `Painel · ${assunto}`,
    conteudo: {
      selo: { texto: "Ação pendente", tom: "alerta" },
      motivo: "Aviso interno do painel da organização",
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
      imagem: imagemFixa("teste"),
      selo: { texto: "Teste" },
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
