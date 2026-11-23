export function PaginaTexto({
  titulo,
  atualizado,
  children,
}: {
  titulo: string;
  atualizado?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-12">
      <h1 className="titulo text-4xl sm:text-5xl">{titulo}</h1>
      {atualizado && (
        <p className="text-sm text-cinza">Última atualização: {atualizado}</p>
      )}
      <div className="conteudo-texto">{children}</div>
    </article>
  );
}
