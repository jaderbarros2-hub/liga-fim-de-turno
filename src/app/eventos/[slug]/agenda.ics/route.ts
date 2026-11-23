import { buscarEvento } from "@/lib/dados";

export const dynamic = "force-dynamic";

const ics = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
const escapar = (t: string) =>
  t.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

/** Arquivo de calendário do evento ("Adicionar à agenda"). */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const evento = await buscarEvento(slug);
  if (!evento) return new Response("Evento não encontrado", { status: 404 });
  const inicio = new Date(evento.inicio);
  const fim = new Date(inicio.getTime() + 3.5 * 3600e3);
  const url = new URL(`/eventos/${slug}`, req.url).toString();
  const corpo = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//First Strike//PT-BR",
    "BEGIN:VEVENT",
    `UID:${evento.id}@firststrike`,
    `DTSTAMP:${ics(new Date())}`,
    `DTSTART:${ics(inicio)}`,
    `DTEND:${ics(fim)}`,
    `SUMMARY:${escapar(`${evento.titulo} · First Strike`)}`,
    `DESCRIPTION:${escapar(`Online no Endstep. O link do evento fica em ${url}`)}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Sua etapa começa em 30 minutos",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(corpo, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
    },
  });
}
