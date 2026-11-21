/**
 * Fundo da chamada do Discord: uma pilha de cartas jogadas na mesa, sobrepostas e cobrindo
 * a faixa toda. Cartas reais do Scryfall dos três formatos; algumas de costas com o verso
 * da liga (desenho próprio, não o verso oficial de Magic).
 */
import { Diamante } from "@/components/Diamante";
import { srcArte, type ArteBanco } from "@/lib/artes";

// Pilha densa: grade com deslocamentos e rotações "aleatórias" fixas (mesmo resultado no servidor e no navegador)
const COLUNAS = 16;
const LINHAS = 4;
const ruido = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const LUGARES = Array.from({ length: COLUNAS * LINHAS }, (_, n) => {
  const col = n % COLUNAS;
  const lin = Math.floor(n / COLUNAS);
  return {
    x:
      (col / (COLUNAS - 1)) * 106 -
      3 +
      (lin % 2 ? 3 : 0) +
      (ruido(n) - 0.5) * 4,
    y: (lin / (LINHAS - 1)) * 120 - 10 + (ruido(n + 99) - 0.5) * 14,
    r: (ruido(n + 7) - 0.5) * 50,
    // De vez em quando uma carta de costas, como numa mesa de verdade
    costas: ruido(n + 31) > 0.93,
  };
});

function Verso() {
  return (
    <div className="carta-solta flex h-full w-full items-center justify-center bg-[linear-gradient(150deg,#1a2a55,#0a1024_60%,#16244a)] p-[7%]">
      <div className="flex h-full w-full items-center justify-center rounded-[6%] border-2 border-ciano/40 bg-[repeating-linear-gradient(45deg,rgb(92_200_255/0.08)_0_6px,transparent_6px_12px)]">
        <Diamante tamanho={54} className="text-ciano/80" />
      </div>
    </div>
  );
}

export function MesaDeCartas({ cartas }: { cartas: ArteBanco[] }) {
  let i = 0;
  return (
    <div className="absolute inset-0 -z-10" aria-hidden="true">
      {LUGARES.map((l, n) => {
        const carta = l.costas
          ? null
          : cartas[i++ % Math.max(cartas.length, 1)];
        return (
          <div
            key={n}
            className="absolute w-[180px] overflow-hidden rounded-[4.75%/3.5%]"
            style={{
              left: `${l.x}%`,
              top: `${l.y}%`,
              aspectRatio: "63 / 88",
              transform: `translate(-50%, -50%) rotate(${l.r}deg)`,
            }}
          >
            {carta?.cartaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={carta.cartaUrl}
                alt=""
                loading="lazy"
                className="carta-solta h-full w-full object-cover"
              />
            ) : carta ? (
              // Sem a imagem da carta inteira: só a ilustração, recortada no formato da carta
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={srcArte(carta)}
                alt=""
                loading="lazy"
                className="carta-solta h-full w-full object-cover"
              />
            ) : (
              <Verso />
            )}
          </div>
        );
      })}
    </div>
  );
}
