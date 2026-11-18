import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CartaDestaque, type LojaDaCarta } from "@/components/CartaDestaque";
import { CartaNoTexto } from "@/components/CartaNoTexto";

/**
 * [[Nome]] no meio da frase vira link com a carta ao passar o mouse.
 * Uma linha só com [[Nome]] vira a carta em destaque (com botão de compra, se houver loja parceira).
 */
const comCartas = (texto: string) =>
  texto
    .replace(/^[ \t]*\[\[([^\]\n]{2,80})\]\][ \t]*$/gm, (_, n: string) => `[${n.trim()}](cartabloco:${encodeURIComponent(n.trim())})`)
    .replace(/\[\[([^\]\n]{2,80})\]\]/g, (_, n: string) => `[${n}](carta:${encodeURIComponent(n.trim())})`);

type No = { type: string; tagName?: string; properties?: { href?: unknown }; children?: No[] };
const ehBloco = (no?: No) => {
  const filhos = (no?.children ?? []).filter((c) => !(c.type === "text"));
  return filhos.length === 1 && filhos[0].tagName === "a" && String(filhos[0].properties?.href ?? "").startsWith("cartabloco:");
};

/**
 * Texto dos artigos em Markdown. HTML cru é ignorado (react-markdown não o interpreta),
 * então o conteúdo não injeta scripts.
 */
export function Markdown({ texto, loja, pagina }: { texto: string; loja?: LojaDaCarta; pagina?: string }) {
  return (
    <div className="conteudo-texto artigo">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => (/^carta(bloco)?:/.test(url) ? url : defaultUrlTransform(url))}
        components={{
          p: ({ node, children }) => (ehBloco(node as No) ? <>{children}</> : <p>{children}</p>),
          a: ({ href = "", children }) =>
            href.startsWith("cartabloco:") ? (
              <CartaDestaque nome={decodeURIComponent(href.slice(11))} loja={loja} pagina={pagina} />
            ) : href.startsWith("carta:") ? (
              <CartaNoTexto nome={decodeURIComponent(href.slice(6))}>{children}</CartaNoTexto>
            ) : (
              <a href={href} {...(/^https?:/.test(href) ? { target: "_blank", rel: "noopener" } : {})}>
                {children}
              </a>
            ),
          // eslint-disable-next-line @next/next/no-img-element
          img: ({ src, alt }) => <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} loading="lazy" />,
        }}
      >
        {comCartas(texto)}
      </ReactMarkdown>
    </div>
  );
}
