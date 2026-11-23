/**
 * Booster desenhado pela liga (não reproduz a embalagem oficial nem logos):
 * arte da coleção, símbolo, nome e selos serrilhados.
 */
export function Booster({
  arte,
  foco = "50% 30%",
  icone,
  nome,
  rotulo,
  largura = 150,
}: {
  arte: string;
  foco?: string;
  icone?: string | null;
  nome: string;
  rotulo: string;
  largura?: number;
}) {
  return (
    <div
      className="booster relative isolate shrink-0 overflow-hidden bg-grafite shadow-2xl shadow-preto"
      style={{ width: largura, aspectRatio: "5 / 8.6" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={arte}
        alt=""
        style={{ objectPosition: foco }}
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-preto/70 via-transparent to-preto/90" />
      <div className="booster-brilho absolute inset-0" />
      <div className="booster-selo absolute inset-x-0 top-0 h-[7%] opacity-90" />
      <div className="booster-selo absolute inset-x-0 bottom-0 h-[7%] opacity-90" />
      <div className="absolute inset-x-0 top-[10%] flex justify-center">
        {icone ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={icone}
            alt=""
            className="h-[18%] min-h-6 w-auto invert drop-shadow-[0_2px_4px_rgba(0,0,0,.8)]"
            style={{ height: largura * 0.2 }}
          />
        ) : null}
      </div>
      <div className="absolute inset-x-0 bottom-[10%] flex flex-col items-center gap-0.5 px-2 text-center">
        <span
          className="titulo leading-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,.9)]"
          style={{ fontSize: largura * 0.14 }}
        >
          {nome}
        </span>
        <span
          className="font-semibold uppercase tracking-[0.2em] text-brasa"
          style={{ fontSize: Math.max(8, largura * 0.06) }}
        >
          {rotulo}
        </span>
      </div>
    </div>
  );
}

/** Boosters em leque (3 no draft, 6 no selado). Abre um pouco ao passar o mouse. */
export function LequeBoosters(props: {
  quantidade: number;
  arte: string;
  foco?: string;
  icone?: string | null;
  nome: string;
  rotulo: string;
}) {
  const n = Math.min(Math.max(props.quantidade, 1), 6);
  const largura = n > 3 ? 120 : 150;
  return (
    <div
      className="leque flex justify-center pb-6 pt-12"
      aria-label={`${n} boosters de ${props.nome}`}
    >
      {Array.from({ length: n }, (_, i) => {
        const meio = i - (n - 1) / 2;
        const fechado = `rotate(${meio * 7}deg) translateY(${Math.abs(meio) * 8}px)`;
        const aberto = `translateX(${meio * 18}px) rotate(${meio * 11}deg) translateY(${Math.abs(meio) * 12 - 12}px)`;
        return (
          <div
            key={i}
            style={{
              ["--fecha" as string]: fechado,
              ["--abre" as string]: aberto,
              marginLeft: i ? -largura * 0.35 : 0,
              zIndex: 10 - Math.abs(Math.round(meio)),
            }}
          >
            {/* Cada pacote mostra um trecho diferente da arte, como uma variação de capa */}
            <Booster
              {...props}
              foco={n > 1 ? `${15 + (i * 70) / (n - 1)}% 30%` : props.foco}
              largura={largura}
            />
          </div>
        );
      })}
    </div>
  );
}
