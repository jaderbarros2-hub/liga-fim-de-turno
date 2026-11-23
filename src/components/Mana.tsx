const CORES: Record<string, string> = {
  W: "bg-[#f3eccb] text-[#3b3423]",
  U: "bg-[#8fc4e8] text-[#0b2a40]",
  B: "bg-[#b9aeaa] text-[#1d1717]",
  R: "bg-[#ec9d81] text-[#3d130b]",
  G: "bg-[#9cc8a2] text-[#0f2e17]",
  C: "bg-[#cbc2bf] text-[#262222]",
};

/** Custo de mana em bolinhas ({1}{U}{U} → ① 🔵 🔵), sem depender de fontes de símbolos. */
export function Mana({
  custo,
  tamanho = 16,
}: {
  custo: string | null;
  tamanho?: number;
}) {
  if (!custo) return null;
  const simbolos = custo.match(/\{[^}]+\}/g) ?? [];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5"
      aria-label={`Custo ${custo}`}
    >
      {simbolos.map((s, i) => {
        const v = s.slice(1, -1).toUpperCase();
        const cor =
          CORES[v] ??
          (v.includes("/")
            ? CORES[v.split("/").find((x) => CORES[x]) ?? "C"]
            : "bg-[#cbc2bf] text-[#262222]");
        return (
          <span
            key={i}
            aria-hidden="true"
            className={`grid place-items-center rounded-full font-bold leading-none shadow-[inset_0_-1px_0_rgba(0,0,0,.25)] ${cor}`}
            style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.6 }}
          >
            {/^[WUBRGC]$/.test(v) ? "" : v.replace("/", "")}
          </span>
        );
      })}
    </span>
  );
}

export const NOMES_COR: Record<string, string> = {
  W: "Branco",
  U: "Azul",
  B: "Preto",
  R: "Vermelho",
  G: "Verde",
};
export const COR_BARRA: Record<string, string> = {
  W: "#f3eccb",
  U: "#4f9fd8",
  B: "#8e8481",
  R: "#e0704c",
  G: "#5fae6c",
};
