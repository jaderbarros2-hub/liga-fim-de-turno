"""
Importa artes em alta resolução para o banco do site.

Pastas (na raiz do projeto, fora do git):
  artes-originais/pauper/     -> cartas legais no Pauper
  artes-originais/premodern/  -> cartas legais no Premodern
  artes-originais/limited/    -> coleções recentes (Limited)
  artes-originais/geral/      -> reserva para banners do site

Em cada pasta: as imagens do MTG Art Downloader (subpastas também valem) e,
de preferência, o lista-<grupo>.json gerado em Painel -> Artes (traz coleção e artista).

Nomes aceitos:
  "Carta (Artista) [SET].jpg"   (padrão do MTG Art Downloader)
  "Carta (Artista).jpg"
  "Carta [SET].jpg" / "Carta.jpg"  (o artista vem do lista-<grupo>.json)

Rodar na raiz do projeto:
  python scripts/importar_artes.py               (todos os grupos)
  python scripts/importar_artes.py pauper        (só um grupo)
  python scripts/importar_artes.py --min 1400    (largura mínima, padrão 1600)
  python scripts/importar_artes.py --prancha     (só gera a prancha de revisão)

Para cada imagem aceita:
  public/artes/<arquivo>.webp       até 1920x1400, usada no site
  public/email/artes/<arquivo>.jpg  1120x440, versão leve para e-mails
e registra em src/lib/artes-banco.json, sem duplicar.
Ao final gera artes-originais/prancha-<grupo>.jpg com as novas, numeradas, para revisão.
"""
import json, os, re, sys, unicodedata
from PIL import Image, ImageDraw, ImageOps

ORIGEM = "artes-originais"
DESTINO = "public/artes"
DESTINO_EMAIL = "public/email/artes"
BANCO = "src/lib/artes-banco.json"
GRUPOS = ("pauper", "premodern", "limited", "geral")
EMAIL_TAM = (1120, 440)
FOCO_PADRAO = "50% 35%"


def slug(t):
    t = unicodedata.normalize("NFD", t).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")


def chave_carta(nome):
    return slug(nome.split("//")[0])


def ler_nome(nome):
    """'Carta (Artista) [SET]' -> (carta, artista, set)."""
    m = re.match(r"^(.*?)\s*(?:\(([^)]+)\))?\s*(?:\[([^\]]+)\])?\s*$", nome)
    carta = re.sub(r"\s+", " ", m.group(1)).strip()
    return carta, (m.group(2) or "").strip(), (m.group(3) or "").strip()


def ler_lista(pasta):
    """Junta os lista-*.json da pasta: índice por carta (e por carta+set)."""
    indice = {}
    for f in os.listdir(pasta):
        if not re.match(r"lista-.*\.json$", f):
            continue
        for i in json.load(open(os.path.join(pasta, f), encoding="utf-8")).get("itens", []):
            k = chave_carta(i["carta"])
            indice.setdefault(k, []).append(i)
    return indice


def foco_em_pixels(foco, w, h, cw, ch):
    """Recorte cw x ch dentro de w x h respeitando o foco CSS ('50% 35%')."""
    fx, fy = (float(v.strip("%")) / 100 for v in foco.split())
    x = round((w - cw) * fx)
    y = round((h - ch) * fy)
    return x, y


def versao_email(im, foco):
    alvo_w, alvo_h = EMAIL_TAM
    escala = max(alvo_w / im.width, alvo_h / im.height)
    r = im.resize((round(im.width * escala), round(im.height * escala)), Image.LANCZOS)
    x, y = foco_em_pixels(foco, r.width, r.height, alvo_w, alvo_h)
    return r.crop((x, y, x + alvo_w, y + alvo_h))


def imagens(pasta):
    for raiz, _, arquivos in os.walk(pasta):
        for f in sorted(arquivos):
            if re.search(r"\.(jpe?g|png|webp)$", f, re.I) and not f.startswith("prancha-"):
                yield os.path.join(raiz, f)


def prancha(itens, destino):
    """Grade numerada com as artes (miniaturas 16:9) para revisão rápida."""
    if not itens:
        return
    col, tw, th = 5, 384, 216
    linhas = (len(itens) + col - 1) // col
    folha = Image.new("RGB", (col * tw, linhas * (th + 28)), (12, 14, 20))
    d = ImageDraw.Draw(folha)
    for n, a in enumerate(itens):
        im = Image.open(os.path.join(DESTINO, a["arquivo"] + ".webp")).convert("RGB")
        im = ImageOps.fit(im, (tw, th), Image.LANCZOS,
                          centering=tuple(float(v.strip("%")) / 100 for v in a.get("foco", FOCO_PADRAO).split()))
        x, y = (n % col) * tw, (n // col) * (th + 28)
        folha.paste(im, (x, y))
        d.text((x + 6, y + th + 6), f"{n + 1}. {a['arquivo']}  {a['largura']}px"[:58], fill=(220, 226, 236))
    folha.save(destino, "JPEG", quality=80)
    print("prancha:", destino)


def main():
    args = sys.argv[1:]
    minimo = 1600
    if "--min" in args:
        i = args.index("--min")
        minimo = int(args[i + 1])
        del args[i:i + 2]
    so_prancha = "--prancha" in args
    grupos = [g for g in args if g in GRUPOS] or list(GRUPOS)

    os.makedirs(DESTINO, exist_ok=True)
    os.makedirs(DESTINO_EMAIL, exist_ok=True)
    banco = json.load(open(BANCO, encoding="utf-8"))
    existentes = {a["arquivo"] for a in banco}
    ja_carta_artista = {(chave_carta(a.get("carta") or ""), slug(a["artista"])) for a in banco}

    for grupo in grupos:
        pasta = os.path.join(ORIGEM, grupo)
        if not os.path.isdir(pasta):
            continue
        novos, pequenas, sem_credito = [], [], []
        if not so_prancha:
            lista = ler_lista(pasta)
            for caminho in imagens(pasta):
                carta, artista, setc = ler_nome(os.path.splitext(os.path.basename(caminho))[0])
                candidatos = lista.get(chave_carta(carta), [])
                meta = next((c for c in candidatos if setc and setc.upper() in (c["set"], c["colecao"].upper())), None) \
                    or next((c for c in candidatos if artista and slug(c["artista"]) == slug(artista)), None) \
                    or (candidatos[0] if len(candidatos) == 1 else None)
                artista = artista or (meta or {}).get("artista", "")
                setc = setc or (meta or {}).get("set", "")
                if meta:
                    carta = meta["carta"]
                if not artista:
                    sem_credito.append(os.path.basename(caminho))
                    continue
                if (chave_carta(carta), slug(artista)) in ja_carta_artista:
                    continue
                arquivo = slug(f"{carta.split('//')[0]}-{setc or artista}")
                if arquivo in existentes:
                    continue
                im = Image.open(caminho)
                im = ImageOps.exif_transpose(im).convert("RGB")
                if im.width < minimo:
                    pequenas.append(f"{os.path.basename(caminho)} ({im.width}px)")
                    continue
                escala = min(1920 / im.width, 1400 / im.height, 1)
                if escala < 1:
                    im = im.resize((round(im.width * escala), round(im.height * escala)), Image.LANCZOS)
                im.save(os.path.join(DESTINO, arquivo + ".webp"), "WEBP", quality=80, method=6)
                versao_email(im, FOCO_PADRAO).save(
                    os.path.join(DESTINO_EMAIL, arquivo + ".jpg"), "JPEG", quality=72, optimize=True, progressive=True)
                item = {"arquivo": arquivo, "carta": carta, "artista": artista, "grupo": grupo,
                        "largura": im.width, "altura": im.height, "foco": FOCO_PADRAO}
                # Coleção: a do nome do arquivo (de onde a arte veio), senão a da lista
                if setc and len(setc) > 6:
                    item["colecao"] = setc
                elif meta and meta.get("colecao"):
                    item["colecao"] = meta["colecao"]
                elif setc:
                    item["colecao"] = setc.upper()
                banco.append(item)
                existentes.add(arquivo)
                ja_carta_artista.add((chave_carta(carta), slug(artista)))
                novos.append(item)
                print("ok:", arquivo, im.size)
            json.dump(banco, open(BANCO, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        else:
            novos = [a for a in banco if a["grupo"] == grupo]

        print(f"\n[{grupo}] {len(novos)} novas, {len(pequenas)} pequenas (< {minimo}px), {len(sem_credito)} sem artista")
        for p in pequenas[:40]:
            print("  pequena:", p)
        for p in sem_credito[:40]:
            print("  sem artista:", p)
        prancha(novos, os.path.join(ORIGEM, f"prancha-{grupo}.jpg"))

    print(f"\nTotal no banco: {len(banco)}")


if __name__ == "__main__":
    main()
