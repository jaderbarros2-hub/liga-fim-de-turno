import Link from "next/link";
import type { Autor } from "@/lib/blogComum";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { salvarAutor } from "../actions";

const CAMPO =
  "min-h-11 w-full rounded-lg border border-borda-forte bg-fundo2 px-3 text-gelo";
const ROTULO = "flex flex-col gap-1 text-sm font-semibold";

export default async function Autores({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string }>;
}) {
  const { editar } = await searchParams;
  const db = criarClienteAdmin();
  const [{ data }, { data: js }] = await Promise.all([
    db
      .from("autores")
      .select("id, nome, bio, avatar_url, link, jogador_id")
      .order("nome"),
    db
      .from("jogadores")
      .select("id, nick_endstep")
      .not("nick_endstep", "is", null)
      .order("nick_endstep"),
  ]);
  const autores =
    (data as (Autor & { jogador_id: string | null })[] | null) ?? [];
  const jogadores = js ?? [];
  const atual = autores.find((a) => a.id === editar);

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <Link href="/painel/blog" className="text-sm">
        ← Blog
      </Link>
      <h1 className="titulo text-5xl">Autores</h1>
      <ul className="flex flex-col border-t border-borda">
        {autores.map((a) => (
          <li
            key={a.id}
            className="flex items-center gap-4 border-b border-borda py-3"
          >
            {a.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.avatar_url}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-full bg-azul font-semibold text-white">
                {a.nome.charAt(0)}
              </span>
            )}
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-semibold">{a.nome}</span>
              <span className="truncate text-sm text-cinza">
                {a.bio ?? "Sem bio"}
              </span>
            </span>
            <a
              href={`/painel/blog/autores?editar=${a.id}#form`}
              className="text-sm font-semibold"
            >
              Editar
            </a>
          </li>
        ))}
      </ul>

      <form
        id="form"
        action={salvarAutor}
        className="grid scroll-mt-20 gap-4 rounded-xl border border-borda p-6"
      >
        <h2 className="titulo text-3xl">
          {atual ? `Editar ${atual.nome}` : "Novo autor"}
        </h2>
        {atual && <input type="hidden" name="id" value={atual.id} />}
        <label className={ROTULO}>
          Nome (como aparece nos artigos)
          <input
            name="nome"
            required
            defaultValue={atual?.nome}
            className={CAMPO}
          />
        </label>
        <label className={ROTULO}>
          Bio curta
          <textarea
            name="bio"
            rows={3}
            maxLength={300}
            defaultValue={atual?.bio ?? ""}
            className={`${CAMPO} py-2`}
          />
        </label>
        <label className={ROTULO}>
          Link (Instagram, YouTube, Twitch…)
          <input
            name="link"
            placeholder="https://"
            defaultValue={atual?.link ?? ""}
            className={CAMPO}
          />
        </label>
        <label className={ROTULO}>
          Perfil de jogador (opcional)
          <select
            name="jogador_id"
            defaultValue={atual?.jogador_id ?? ""}
            className={CAMPO}
          >
            <option value="">Não é jogador da liga</option>
            {jogadores.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nick_endstep}
              </option>
            ))}
          </select>
          <span className="text-xs font-normal text-cinza">
            Liga os artigos ao perfil público do jogador, e o nome do autor vira
            link.
          </span>
        </label>
        <label className={ROTULO}>
          Foto (quadrada, até 3 MB)
          <input
            type="file"
            name="avatar"
            accept="image/png,image/jpeg,image/webp"
            className="text-sm font-normal"
          />
        </label>
        <div className="flex gap-4">
          <button
            type="submit"
            className="min-h-11 rounded-lg bg-azul px-5 font-semibold text-white"
          >
            Salvar autor
          </button>
          {atual && (
            <Link href="/painel/blog/autores" className="self-center text-sm">
              Cancelar
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
