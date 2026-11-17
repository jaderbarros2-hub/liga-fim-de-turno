"""
Importa artes em alta resolução para o banco do site.

Coloque as imagens em:
  artes-originais/pauper/  -> cartas legais no Pauper (usadas em tudo)
  artes-originais/geral/   -> qualquer arte de Magic (Limited e banners gerais)

Nomes aceitos:
  "Carta (Artista) [SET].jpg"  (padrão do MTG Art Downloader)
  "Carta (Artista).jpg"
Rodar na raiz do projeto:  python scripts/importar_artes.py
Converte para WebP (até 1920px de largura, 1400px de altura), grava em public/artes
e atualiza src/lib/artes-banco.json sem duplicar o que já existe.
"""
import json, os, re, unicodedata
from PIL import Image

ORIGEM = "artes-originais"
DESTINO = "public/artes"
BANCO = "src/lib/artes-banco.json"

def slug(t):
    t = unicodedata.normalize("NFD", t).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")

banco = json.load(open(BANCO, encoding="utf-8"))
existentes = {a["arquivo"] for a in banco}
novos = 0
for grupo in ("pauper", "geral"):
    pasta = os.path.join(ORIGEM, grupo)
    if not os.path.isdir(pasta):
        continue
    for f in sorted(os.listdir(pasta)):
        if not re.search(r"\.(jpe?g|png|webp)$", f, re.I):
            continue
        nome = os.path.splitext(f)[0]
        m = re.match(r"^(.*?)\s*\(([^)]+)\)\s*(?:\[([^\]]+)\])?\s*$", nome)
        if not m:
            print("ignorado (sem artista no nome):", f)
            continue
        carta, artista, colecao = m.group(1).strip(), m.group(2).strip(), (m.group(3) or "").strip()
        arquivo = slug(f"{carta}-{colecao or artista}")
        if arquivo in existentes:
            continue
        im = Image.open(os.path.join(pasta, f)).convert("RGB")
        escala = min(1920 / im.width, 1400 / im.height, 1)
        if escala < 1:
            im = im.resize((round(im.width * escala), round(im.height * escala)), Image.LANCZOS)
        if im.width < 800:
            print("ignorado (resolução baixa):", f, im.size)
            continue
        im.save(os.path.join(DESTINO, arquivo + ".webp"), "WEBP", quality=80, method=6)
        item = {"arquivo": arquivo, "carta": carta, "artista": artista, "grupo": grupo,
                "largura": im.width, "altura": im.height, "foco": "50% 35%"}
        if colecao:
            item["colecao"] = colecao.upper()
        banco.append(item)
        existentes.add(arquivo)
        novos += 1
        print("ok:", arquivo, im.size)

json.dump(banco, open(BANCO, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{novos} artes novas. Total no banco: {len(banco)}")
