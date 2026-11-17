import Link from "next/link";
import type { ComponentProps } from "react";

type Variante = "primario" | "contorno" | "texto";

const estilos: Record<Variante, string> = {
  primario:
    "corte bg-azul px-7 text-white hover:bg-azul-escuro hover:text-white tracking-wide uppercase",
  contorno: "border border-borda-forte text-gelo hover:border-ciano hover:text-gelo",
  texto: "text-ciano hover:text-[#8fdbff] px-0",
};

const base =
  "inline-flex items-center justify-center min-h-11 px-5 rounded-lg font-semibold text-sm no-underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export function BotaoLink({
  variante = "primario",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante }) {
  return <Link className={`${base} ${estilos[variante]} ${className}`} {...props} />;
}

export function Botao({
  variante = "primario",
  className = "",
  ...props
}: ComponentProps<"button"> & { variante?: Variante }) {
  return <button className={`${base} ${estilos[variante]} ${className}`} {...props} />;
}

export function Etiqueta({
  children,
  tipo = "azul",
}: {
  children: React.ReactNode;
  tipo?: "azul" | "ciano" | "contorno" | "alerta";
}) {
  const cores = {
    azul: "bg-azul text-white",
    ciano: "bg-ciano text-preto",
    contorno: "border border-ciano text-ciano",
    alerta: "border border-alerta text-alerta",
  };
  return (
    <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-semibold uppercase ${cores[tipo]}`}>
      {children}
    </span>
  );
}
