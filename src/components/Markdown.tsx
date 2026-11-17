import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CartaNoTexto } from "@/components/CartaNoTexto";

/** [[Nome da Carta]] vira um link especial que mostra a carta ao passar o mouse. */
const comCartas = (texto: string) =>
  texto.replace(/\[\[([^\]\n]{2,80})\]\]/g, (_, nome: string) => `[${nome}](carta:${encodeURIComponent(nome.trim())})`);

/**
 * Texto dos artigos em Markdown. HTML cru é ignorado (react-markdown não o interpreta),
 * então o conteúdo não injeta scripts mesmo vindo de um colaborador.
 */
export function Markdown({ texto }: { texto: string }) {
  return (
    <div className="conteudo-texto artigo">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => (url.startsWith("carta:") ? url : defaultUrlTransform(url))}
        components={{
          a: ({ href = "", children }) =>
            href.startsWith("carta:") ? (
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
