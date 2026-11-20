/**
 * Fundo da vitrine do evento (boosters ou cartas): a arte do evento desfocada e escurecida,
 * com um brilho embaixo das cartas. Respira devagar e se aproxima ao passar o mouse.
 */
export function Palco({
  arte,
  foco = "50% 30%",
  cor = "#5cc8ff",
  children,
}: {
  arte: string;
  foco?: string;
  cor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="palco relative isolate overflow-hidden bg-fundo2 px-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={arte}
        alt=""
        aria-hidden="true"
        style={{ objectPosition: foco }}
        className="palco-fundo absolute inset-0 -z-30 h-full w-full object-cover opacity-75 blur-sm"
      />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgb(11_14_20/0.85)_100%)]" />
      <div
        className="palco-brilho absolute inset-x-[15%] bottom-[8%] -z-10 h-1/2 rounded-[50%] blur-3xl"
        style={{ background: cor }}
      />
      {children}
    </div>
  );
}
